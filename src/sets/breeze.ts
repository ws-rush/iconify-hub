import type { IconSetDefinition } from '../types.js';

export const breezeSet: IconSetDefinition = {
  id: 'breeze',
  prefix: 'breeze',
  source: {
    type: 'git',
    url: 'https://github.com/KDE/breeze-icons.git',
    ref: 'v6.32.0',
    subDir: 'icons',
  },
  info: {
    name: 'KDE Breeze',
    version: '6.32.0',
    author: {
      name: 'KDE Visual Design Group',
      url: 'https://invent.kde.org/frameworks/breeze-icons',
    },
    license: {
      title: 'LGPL-3.0',
      spdx: 'LGPL-3.0-or-later',
      url: 'https://invent.kde.org/frameworks/breeze-icons/-/blob/master/COPYING.LIB',
    },
    samples: ['document-open', 'document-save', 'edit-copy', 'folder', 'help-about'],
    height: 22,
    displayHeight: 22,
    category: 'General',
  },
  transform: {
    include: [/\b22\//],
    monotoneColor: 'currentColor',
    normalizeName(rawName, relativePath) {
      const parts = relativePath.split('/');
      const rawCategory = parts.length > 0 ? parts[0] : 'General';
      const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

      let name = rawName;
      const aliases: string[] = [];

      if (rawName.endsWith('-symbolic')) {
        name = rawName.slice(0, -'-symbolic'.length);
        aliases.push(rawName);
      } else {
        aliases.push(`${rawName}-symbolic`);
      }

      return {
        name,
        aliases,
        category,
      };
    },
  },
  package: {
    name: '@iconify-hub/breeze',
    version: '6.32.0',
    description: 'Unofficial KDE Breeze icon set in Iconify JSON format',
    keywords: ['kde', 'breeze', 'plasma', 'desktop', 'linux'],
  },
  exportSVGs: true,
};
