import type { IconSetDefinition } from '../types.js';

export const adwSet: IconSetDefinition = {
  id: 'adw',
  prefix: 'adw',
  source: {
    type: 'git',
    url: 'https://gitlab.gnome.org/GNOME/adwaita-icon-theme.git',
    ref: '49.0',
    subDir: 'Adwaita/symbolic',
    fallbackLocalDir: '/usr/share/icons/Adwaita/symbolic',
  },
  info: {
    name: 'GNOME Adwaita',
    version: '49.0.0',
    author: {
      name: 'GNOME Project',
      url: 'https://gitlab.gnome.org/GNOME/adwaita-icon-theme',
    },
    license: {
      title: 'CC-BY-SA-4.0',
      spdx: 'CC-BY-SA-4.0',
      url: 'https://gitlab.gnome.org/GNOME/adwaita-icon-theme/-/blob/master/COPYING',
    },
    samples: ['edit-copy', 'document-open', 'dialog-information', 'folder'],
    height: 16,
    displayHeight: 16,
    category: 'General',
  },
  transform: {
    monotoneColor: 'currentColor',
    normalizeName(rawName, relativePath) {
      // Split path to extract category folder (e.g. "actions", "status")
      const parts = relativePath.split('/');
      const rawCategory = parts.length > 1 ? parts[0] : 'General';
      const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

      // Clean up symbolic suffix
      let name = rawName;
      const aliases: string[] = [];

      if (rawName.endsWith('-symbolic')) {
        name = rawName.slice(0, -'-symbolic'.length);
        // Retain original GTK symbolic name as an alias
        aliases.push(rawName);
      } else {
        // Also provide -symbolic alias if upstream did not include suffix
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
    name: '@iconify-hub/adw',
    version: '49.0.0',
    description: 'Unofficial GNOME Adwaita icon set in Iconify JSON format',
    keywords: ['gnome', 'adwaita', 'gtk', 'symbolic', 'desktop'],
  },
  exportSVGs: true,
};
