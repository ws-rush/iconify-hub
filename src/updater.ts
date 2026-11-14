import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { IconSetDefinition, UpstreamCheckResult } from './types.js';
import { Pipeline } from './pipeline.js';
import { getAllSets, getSet } from './sets/index.js';

const execFileAsync = promisify(execFile);

/**
 * Fetches and returns the latest git tag matching the given regex pattern.
 */
export async function getLatestGitTag(url: string, pattern?: string): Promise<string> {
  const { stdout } = await execFileAsync('git', ['ls-remote', '--tags', '--refs', url]);
  const rx = pattern ? new RegExp(pattern) : /^v?\d+(\.\d+)*$/;

  const tags = stdout
    .split('\n')
    .map((line) => line.split('\t')[1])
    .filter(Boolean)
    .map((ref) => ref.replace(/^refs\/tags\//, ''))
    .filter((tag) => rx.test(tag));

  if (!tags.length) {
    throw new Error(`No matching tags found for url: ${url}`);
  }

  // Sort tags using natural numeric comparison
  tags.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return tags[tags.length - 1];
}

/**
 * Checks whether an upstream git source has a newer tag available.
 */
export async function checkUpstream(def: IconSetDefinition): Promise<UpstreamCheckResult> {
  if (def.source.type !== 'git') {
    return {
      id: def.id,
      name: def.info.name,
      currentRef: 'n/a',
      latestRef: 'n/a',
      hasUpdate: false,
    };
  }

  const latest = await getLatestGitTag(def.source.url, def.source.tagPattern);
  const hasUpdate = latest !== def.source.ref;

  return {
    id: def.id,
    name: def.info.name,
    currentRef: def.source.ref,
    latestRef: latest,
    hasUpdate,
  };
}

/**
 * Updates a set definition file and triggers a rebuild if an update is found.
 */
export async function updateSetDefinition(
  def: IconSetDefinition,
  latestRef: string
): Promise<void> {
  const setFilePath = path.resolve(process.cwd(), `src/sets/${def.id}.ts`);
  let content = await fs.readFile(setFilePath, 'utf8');

  // Replace git ref
  content = content.replace(
    new RegExp(`ref:\\s*['"\`]${escapeRegex(def.source.type === 'git' ? def.source.ref : '')}['"\`]`),
    `ref: '${latestRef}'`
  );

  // Normalize semver (remove 'v' prefix for package version)
  const newVersion = latestRef.replace(/^v/, '');
  content = content.replace(
    new RegExp(`version:\\s*['"\`]${escapeRegex(def.package.version)}['"\`]`, 'g'),
    `version: '${newVersion}'`
  );

  await fs.writeFile(setFilePath, content, 'utf8');

  // Dynamically import updated definition and rebuild
  const pipeline = new Pipeline();
  const updatedModule = await import(`${setFilePath}?t=${Date.now()}`);
  const updatedDef: IconSetDefinition = updatedModule[`${def.id}Set`] || updatedModule.default;

  await pipeline.build(updatedDef);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks all registered sets and updates any with newer upstream versions.
 */
export async function runUpstreamCheck(autoUpdate = false): Promise<UpstreamCheckResult[]> {
  const sets = getAllSets();
  const results: UpstreamCheckResult[] = [];

  for (const def of sets) {
    try {
      console.log(`[updater] Checking upstream for "${def.id}" (${def.info.name})...`);
      const res = await checkUpstream(def);
      results.push(res);

      if (res.hasUpdate) {
        console.log(
          `[updater] ⚡ New release found for "${def.id}": ${res.currentRef} -> ${res.latestRef}`
        );
        if (autoUpdate) {
          console.log(`[updater] Updating definition and rebuilding "${def.id}"...`);
          await updateSetDefinition(def, res.latestRef);
          console.log(`[updater] ✔ Successfully updated "${def.id}" to ${res.latestRef}`);
        }
      } else {
        console.log(`[updater] ✔ "${def.id}" is up to date (${res.currentRef})`);
      }
    } catch (err) {
      console.error(`[updater] ✖ Failed checking upstream for "${def.id}": ${(err as Error).message}`);
    }
  }

  return results;
}
