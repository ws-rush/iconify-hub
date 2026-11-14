import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { IconSourceConfig } from './types.js';

const execFileAsync = promisify(execFile);

export class SourceManager {
  private cacheRoot: string;

  constructor(cacheRoot = path.resolve(process.cwd(), '.cache/sources')) {
    this.cacheRoot = cacheRoot;
  }

  /**
   * Resolves the source directory containing the raw SVG icons.
   * Ensures idempotency: re-running uses cached clone or pulls clean ref.
   */
  async resolveSource(id: string, config: IconSourceConfig): Promise<string> {
    if (config.type === 'local') {
      if (!existsSync(config.path)) {
        throw new Error(`Local source directory not found: ${config.path}`);
      }
      return config.path;
    }

    if (config.type === 'git') {
      const targetDir = path.join(this.cacheRoot, id);
      const subPath = config.subDir ? path.join(targetDir, config.subDir) : targetDir;

      try {
        await this.syncGitRepo(config.url, config.ref, targetDir);
        if (!existsSync(subPath)) {
          throw new Error(`Subdirectory "${config.subDir}" not found in cloned repo ${targetDir}`);
        }
        return subPath;
      } catch (err) {
        if (config.fallbackLocalDir && existsSync(config.fallbackLocalDir)) {
          console.warn(
            `[source] Warning: Git clone failed (${(err as Error).message}), falling back to local directory: ${config.fallbackLocalDir}`
          );
          return config.fallbackLocalDir;
        }
        throw err;
      }
    }

    if (config.type === 'tarball') {
      throw new Error('Tarball sources not yet implemented');
    }

    throw new Error(`Unsupported source type`);
  }

  /**
   * Clones or fetches a git repo idempotently.
   */
  private async syncGitRepo(url: string, ref: string, targetDir: string): Promise<void> {
    await fs.mkdir(this.cacheRoot, { recursive: true });

    if (existsSync(path.join(targetDir, '.git'))) {
      try {
        const { stdout } = await execFileAsync('git', ['describe', '--tags', '--always'], {
          cwd: targetDir,
        });
        if (stdout.trim() === ref) {
          return;
        }
      } catch {
        // Fall through to re-clone or fetch
      }
    }

    // Clean target dir and perform shallow clone of specific ref
    await fs.rm(targetDir, { recursive: true, force: true });
    await execFileAsync('git', ['clone', '--depth', '1', '--branch', ref, url, targetDir]);
  }
}
