#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { validateIconSet } from '@iconify/utils';
import { Pipeline } from './pipeline.js';
import { getAllSets, getSet } from './sets/index.js';
import { runUpstreamCheck, checkUpstream, updateSetDefinition } from './updater.js';

const [, , command = 'build', target] = process.argv;

async function run() {
  const pipeline = new Pipeline();

  switch (command) {
    case 'build': {
      if (target) {
        const def = getSet(target);
        if (!def) {
          console.error(`Error: Unknown icon set "${target}". Registered sets: ${getAllSets().map((s) => s.id).join(', ')}`);
          process.exit(1);
        }
        await pipeline.build(def);
      } else {
        const sets = getAllSets();
        console.log(`Building all registered sets: ${sets.map((s) => s.id).join(', ')}`);
        for (const def of sets) {
          await pipeline.build(def);
        }
      }
      break;
    }

    case 'list': {
      const sets = getAllSets();
      console.log(`Registered Icon Sets (${sets.length}):\n`);
      for (const s of sets) {
        console.log(`• [${s.id}] ${s.info.name}`);
        console.log(`  Prefix:      ${s.prefix}`);
        console.log(`  Version:     ${s.package.version}`);
        console.log(`  Package:     ${s.package.name}`);
        console.log(`  Source:      ${s.source.type} (${s.source.type === 'git' ? s.source.url : ''})`);
        console.log(`  Destination: ${s.outDir || `packages/${s.id}`}\n`);
      }
      break;
    }

    case 'validate': {
      const sets = target ? [getSet(target)].filter(Boolean) : getAllSets();
      if (!sets.length) {
        console.error(`No sets found to validate.`);
        process.exit(1);
      }

      for (const def of sets) {
        if (!def) continue;
        const outDir = path.resolve(process.cwd(), def.outDir || `packages/${def.id}`);
        const iconsJsonPath = path.join(outDir, 'icons.json');
        if (!existsSync(iconsJsonPath)) {
          console.error(`[validate] Set "${def.id}" has not been built yet (missing ${iconsJsonPath}). Run build first.`);
          process.exit(1);
        }
        const raw = await fs.readFile(iconsJsonPath, 'utf8');
        const data = JSON.parse(raw);
        validateIconSet(data);
        console.log(`✔ [validate] Set "${def.id}" passed Iconify schema validation (${Object.keys(data.icons).length} icons, ${Object.keys(data.aliases || {}).length} aliases)`);
      }
      break;
    }

    case 'check': {
      console.log('Checking upstream repositories for new releases...\n');
      const results = await runUpstreamCheck(false);
      const updates = results.filter((r) => r.hasUpdate);
      if (updates.length > 0) {
        console.log(`\nUpdates available for ${updates.length} set(s):`);
        for (const u of updates) {
          console.log(`• ${u.name} (${u.id}): ${u.currentRef} -> ${u.latestRef}`);
        }
      } else {
        console.log('\nAll icon sets are up to date with upstream!');
      }
      break;
    }

    case 'update': {
      console.log('Checking and updating upstream repositories...\n');
      const results = await runUpstreamCheck(true);
      const updates = results.filter((r) => r.hasUpdate);
      if (updates.length > 0) {
        console.log(`\nUpdated ${updates.length} set(s) successfully!`);
      } else {
        console.log('\nNo updates needed. All icon sets are current.');
      }
      break;
    }

    case 'new': {
      if (!target) {
        console.error(`Usage: iconify-hub new <set-id>`);
        process.exit(1);
      }
      const setPath = path.resolve(process.cwd(), `src/sets/${target}.ts`);
      if (existsSync(setPath)) {
        console.error(`Error: Set definition already exists at ${setPath}`);
        process.exit(1);
      }
      const template = `import type { IconSetDefinition } from '../types.js';

export const ${target}Set: IconSetDefinition = {
  id: '${target}',
  prefix: '${target}',
  source: {
    type: 'git',
    url: 'https://example.com/repo.git',
    ref: 'main',
    subDir: 'icons',
  },
  info: {
    name: '${target.toUpperCase()}',
    version: '1.0.0',
    author: {
      name: 'Author Name',
      url: 'https://example.com',
    },
    license: {
      title: 'MIT',
      spdx: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    category: 'General',
  },
  package: {
    name: '@iconify-hub/${target}',
    version: '1.0.0',
    description: '${target.toUpperCase()} unofficial icon set in Iconify format',
  },
  exportSVGs: true,
};
`;
      await fs.writeFile(setPath, template, 'utf8');
      console.log(`Scaffolded new set definition at: ${setPath}`);
      console.log(`Remember to register it in src/sets/index.ts!`);
      break;
    }

    default:
      console.log(`Unknown command "${command}". Available commands: build, list, validate, new`);
      process.exit(1);
  }
}

run().catch((err) => {
  console.error('[cli] Fatal error:', err);
  process.exit(1);
});
