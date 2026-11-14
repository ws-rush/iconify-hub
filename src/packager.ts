import fs from 'node:fs/promises';
import path from 'node:path';
import { exportJSONPackage, exportToDirectory, type IconSet } from '@iconify/tools';
import type { IconSetDefinition, BuildResult } from './types.js';

export class Packager {
  /**
   * Exports the built IconSet into a standard Iconify package.
   */
  async exportPackage(
    def: IconSetDefinition,
    iconSet: IconSet,
    categories: Record<string, string[]>
  ): Promise<BuildResult> {
    const outDir = path.resolve(process.cwd(), def.outDir || `packages/${def.id}`);
    await fs.mkdir(outDir, { recursive: true });

    // 1. Export standard Iconify JSON package
    const exportedFiles = await exportJSONPackage(iconSet, {
      target: outDir,
      cleanup: true,
      package: {
        name: def.package.name,
        version: def.package.version,
        description:
          def.package.description ||
          `${def.info.name} unofficial icon set in Iconify JSON format`,
        license: def.info.license?.spdx || def.info.license?.title || 'ISC',
        keywords: [
          'iconify',
          'icons',
          'iconset',
          def.prefix,
          ...(def.package.keywords || []),
        ],
      },
      customisePackage(pkg) {
        pkg.publishConfig = {
          access: 'public',
        };
        pkg.repository = {
          type: 'git',
          url: 'https://github.com/iconify-hub/iconify-hub',
          directory: path.relative(process.cwd(), outDir),
        };
      },
    });

    // 2. Export individual SVGs if requested
    if (def.exportSVGs !== false) {
      const svgDir = path.join(outDir, 'svg');
      await exportToDirectory(iconSet, {
        target: svgDir,
        cleanup: true,
      });
      exportedFiles.push('svg/');
    }

    // 3. Generate README.md
    const readmeContent = this.generateReadme(def, iconSet, categories);
    await fs.writeFile(path.join(outDir, 'README.md'), readmeContent, 'utf8');
    exportedFiles.push('README.md');

    const exportedJSON = iconSet.export();

    return {
      id: def.id,
      prefix: def.prefix,
      totalIcons: iconSet.count(),
      totalAliases: Object.keys(exportedJSON.aliases || {}).length,
      categories,
      outDir,
      iconSet: exportedJSON,
      files: exportedFiles,
    };
  }

  private generateReadme(
    def: IconSetDefinition,
    iconSet: IconSet,
    categories: Record<string, string[]>
  ): string {
    const pkgName = def.package.name;
    const prefix = def.prefix;
    const total = iconSet.count();
    const catList = Object.entries(categories)
      .map(([cat, icons]) => `- **${cat}** (${icons.length} icons)`)
      .join('\n');

    return `# ${def.info.name} (${pkgName})

Unofficial Iconify dataset for **${def.info.name}**.

- **Icon Prefix:** \`${prefix}\`
- **Total Icons:** ${total}
- **Version:** ${def.package.version}
- **License:** [${def.info.license?.title || 'License'}](${def.info.license?.url || '#'})
- **Author:** [${def.info.author?.name || 'Upstream'}](${def.info.author?.url || '#'})

## Installation

\`\`\`bash
npm install ${pkgName}
# or
pnpm add ${pkgName}
# or
yarn add ${pkgName}
\`\`\`

## Usage

### 1. With UnoCSS (\`@unocss/preset-icons\`)

\`\`\`ts
// uno.config.ts
import { defineConfig, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      collections: {
        ${prefix}: () => import('${pkgName}/icons.json').then(i => i.default),
      },
    }),
  ],
})
\`\`\`

Then use in your templates:
\`\`\`html
<span class="i-${prefix}:document-edit"></span>
\`\`\`

### 2. With \`unplugin-icons\`

\`\`\`ts
// vite.config.ts
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default {
  plugins: [
    Icons({
      customCollections: {
        '${prefix}': () => import('${pkgName}/icons.json').then(m => m.default),
      },
    }),
  ],
}
\`\`\`

### 3. With Iconify React / Vue / Svelte

\`\`\`tsx
import { Icon } from '@iconify/react'
import icons from '${pkgName}/icons.json'
import { addCollection } from '@iconify/react'

addCollection(icons)

export function App() {
  return <Icon icon="${prefix}:edit-copy" />
}
\`\`\`

### 4. Direct SVG Access

Optimized SVG files are provided directly in \`svg/\`:
\`\`\`
${pkgName}/svg/edit-copy.svg
\`\`\`

## Categories

${catList}
`;
  }
}
