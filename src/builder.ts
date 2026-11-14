import fs from 'node:fs/promises';
import path from 'node:path';
import { IconSet, SVG, cleanupSVG, runSVGO, parseColors, checkBadTags } from '@iconify/tools';
import { validateIconSet } from '@iconify/utils';
import type { IconSetDefinition } from './types.js';

export interface ScanResult {
  filePath: string;
  relativePath: string;
  rawName: string;
  folderCategory?: string;
}

/**
 * Recursively scans directory for all SVG files.
 */
export async function scanSVGFiles(dir: string, baseDir = dir): Promise<ScanResult[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: ScanResult[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    let isDir = entry.isDirectory();
    let isFile = entry.isFile();

    if (entry.isSymbolicLink()) {
      try {
        const stat = await fs.stat(fullPath);
        // Do not recurse into directory symlinks to avoid infinite loops and duplicate passes
        isDir = false;
        isFile = stat.isFile();
      } catch {
        continue;
      }
    }

    if (isDir) {
      results.push(...(await scanSVGFiles(fullPath, baseDir)));
    } else if (isFile && entry.name.endsWith('.svg')) {
      const relativePath = path.relative(baseDir, fullPath);
      const parts = relativePath.split(path.sep);
      const folderCategory = parts.length > 1 ? parts[0] : undefined;
      const rawName = path.basename(entry.name, '.svg');

      results.push({
        filePath: fullPath,
        relativePath,
        rawName,
        folderCategory,
      });
    }
  }

  return results;
}

/**
 * Builds an IconSet from source files according to definition.
 */
export async function buildIconSet(
  def: IconSetDefinition,
  sourceDir: string
): Promise<{ iconSet: IconSet; categories: Record<string, string[]> }> {
  const iconSet = new IconSet({
    prefix: def.prefix,
    icons: {},
  });

  const files = await scanSVGFiles(sourceDir);
  const categoriesMap: Record<string, Set<string>> = {};

  for (const file of files) {
    // Check inclusions
    if (def.transform?.include && !def.transform.include.some((rx) => rx.test(file.relativePath))) {
      continue;
    }

    // Check exclusions
    if (def.transform?.exclude?.some((rx) => rx.test(file.relativePath))) {
      continue;
    }

    // Determine normalized name & aliases
    let finalName = file.rawName;
    let aliases: string[] = [];
    let category = file.folderCategory
      ? file.folderCategory.charAt(0).toUpperCase() + file.folderCategory.slice(1)
      : undefined;

    if (def.transform?.normalizeName) {
      const normalized = def.transform.normalizeName(file.rawName, file.relativePath);
      if (!normalized) continue;
      finalName = normalized.name;
      if (normalized.aliases) aliases = normalized.aliases;
      if (normalized.category) category = normalized.category;
    } else {
      // Default Adwaita / symbolic style normalization
      if (finalName.endsWith('-symbolic')) {
        const base = finalName.replace(/-symbolic$/, '');
        aliases.push(finalName);
        finalName = base;
      }
    }

    // Read, parse, clean, optimize, and register SVG
    try {
      const content = await fs.readFile(file.filePath, 'utf8');
      const svg = new SVG(content);
      await cleanupSVG(svg);
      await checkBadTags(svg);

      // Color handling:
      // Replace dark neutral fills with currentColor while preserving accent colors (error/warning/success).
      const monotoneColor = def.transform?.monotoneColor || 'currentColor';
      await parseColors(svg, {
        defaultColor: monotoneColor,
        callback: (attr, colorStr) => {
          if (def.transform?.colorCallback) {
            const custom = def.transform.colorCallback({ prop: attr, value: colorStr });
            if (custom !== undefined) return custom;
          }

          const normalized = colorStr.toLowerCase().trim();
          // Standard GNOME / KDE symbolic dark neutral tones
          if (
            normalized === '#2e3436' ||
            normalized === '#222222' ||
            normalized === '#2e3434' ||
            normalized === '#232629' ||
            normalized === '#31363b' ||
            normalized === '#4d4d4d' ||
            normalized === '#000000' ||
            normalized === 'black'
          ) {
            return monotoneColor;
          }

          // Keep explicit accents (e.g. #ed333b red, #ff7800 orange, #33d17a green, #3584e4 blue, #ffffff)
          return colorStr;
        },
      });

      // Run SVGO optimization
      await runSVGO(svg, {
        plugins: [
          'preset-default',
          'removeDimensions',
          {
            name: 'removeAttrs',
            params: {
              attrs: ['class', 'color'],
            },
          },
        ],
      });

      // Add to IconSet
      iconSet.fromSVG(finalName, svg);

      // Register aliases
      for (const alias of aliases) {
        if (alias !== finalName) {
          iconSet.setAlias(alias, finalName);
        }
      }

      // Track category
      if (category) {
        iconSet.toggleCategory(finalName, category, true);
        if (!categoriesMap[category]) categoriesMap[category] = new Set();
        categoriesMap[category].add(finalName);
      }
    } catch (err) {
      console.warn(`[builder] Skipping broken SVG ${file.relativePath}: ${(err as Error).message}`);
      continue;
    }
  }

  // Set metadata
  iconSet.info = {
    name: def.info.name,
    total: iconSet.count(),
    version: def.info.version,
    author: def.info.author || { name: 'Unknown' },
    license: def.info.license || { title: 'Custom' },
    samples: def.info.samples,
    height: def.info.height,
    displayHeight: def.info.displayHeight,
    category: def.info.category,
    palette: def.info.palette,
  };

  // Validate the icon set using @iconify/utils
  const exported = iconSet.export();
  validateIconSet(exported);

  const finalCategories: Record<string, string[]> = {};
  for (const [cat, set] of Object.entries(categoriesMap)) {
    finalCategories[cat] = Array.from(set).sort();
  }

  return { iconSet, categories: finalCategories };
}
