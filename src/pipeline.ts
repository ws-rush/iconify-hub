import { SourceManager } from './source.js';
import { buildIconSet } from './builder.js';
import { Packager } from './packager.js';
import type { IconSetDefinition, BuildResult } from './types.js';

export class Pipeline {
  private sourceManager: SourceManager;
  private packager: Packager;

  constructor() {
    this.sourceManager = new SourceManager();
    this.packager = new Packager();
  }

  /**
   * Executes the full pipeline for an icon set definition:
   * 1. Fetches/resolves upstream sources
   * 2. Builds IconSet with cleanup, SVGO, color handling
   * 3. Exports standard Iconify package
   */
  async build(def: IconSetDefinition): Promise<BuildResult> {
    console.log(`[pipeline] Resolving upstream source for "${def.id}"...`);
    const sourceDir = await this.sourceManager.resolveSource(def.id, def.source);
    console.log(`[pipeline] Source ready at: ${sourceDir}`);

    console.log(`[pipeline] Processing SVGs and constructing IconSet "${def.prefix}"...`);
    const { iconSet, categories } = await buildIconSet(def, sourceDir);
    console.log(
      `[pipeline] Built ${iconSet.count()} icons across ${Object.keys(categories).length} categories`
    );

    console.log(`[pipeline] Packaging into standard Iconify format...`);
    const result = await this.packager.exportPackage(def, iconSet, categories);
    console.log(
      `[pipeline] Successfully generated package at: ${result.outDir} (${result.files.length} files)`
    );

    return result;
  }
}
