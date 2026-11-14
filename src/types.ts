import type { IconifyInfo, IconifyJSON } from '@iconify/types';

/**
 * Upstream source strategy for fetching raw icon assets.
 */
export type IconSourceConfig =
  | {
      type: 'git';
      /** Git repository URL (e.g. https://gitlab.gnome.org/GNOME/adwaita-icon-theme.git) */
      url: string;
      /** Git tag or commit hash or branch (e.g. '49.0') */
      ref: string;
      /** Subdirectory inside repo that contains SVGs (e.g. 'Adwaita/symbolic') */
      subDir?: string;
      /** Fallback local directory if offline/cached (e.g. '/usr/share/icons/Adwaita/symbolic') */
      fallbackLocalDir?: string;
    }
  | {
      type: 'local';
      /** Local directory path containing SVGs */
      path: string;
    }
  | {
      type: 'tarball';
      /** URL to archive (tar.gz, zip) */
      url: string;
      /** Subdirectory inside archive */
      subDir?: string;
    };

/**
 * Options for transforming individual icons.
 */
export interface IconTransformConfig {
  /**
   * Function to normalize or rename icon identifiers.
   * Return null or undefined to skip/exclude the icon.
   */
  normalizeName?: (name: string, relativePath: string) => {
    name: string;
    aliases?: string[];
    category?: string;
  } | null;

  /**
   * Default color replacement for monotone icons.
   * Typically 'currentColor' so icons can be styled with CSS color.
   * Default is 'currentColor'.
   */
  monotoneColor?: string;

  /**
   * Color callback for advanced color parsing.
   */
  colorCallback?: (
    item: {
      prop: string;
      value: string;
    }
  ) => string | undefined;

  /**
   * Exclude file pattern (regex or glob)
   */
  exclude?: RegExp[];
}

/**
 * Configuration for an unofficial icon set.
 */
export interface IconSetDefinition {
  /** Unique ID for the set, e.g. 'adw' */
  id: string;

  /** Iconify prefix for the set, e.g. 'adw' */
  prefix: string;

  /** Upstream source configuration */
  source: IconSourceConfig;

  /** Iconify metadata */
  info: {
    name: string;
    version?: string;
    author?: {
      name: string;
      url?: string;
    };
    license?: {
      title: string;
      spdx?: string;
      url?: string;
    };
    samples?: string[];
    height?: number;
    displayHeight?: number;
    category?: string;
    palette?: boolean;
  };

  /** Transform options */
  transform?: IconTransformConfig;

  /** Target package distribution options */
  package: {
    /** NPM package name, e.g. '@iconify-hub/adw' or '@iconify-json/adw' */
    name: string;
    /** Version string */
    version: string;
    /** Package description */
    description?: string;
    /** Keywords */
    keywords?: string[];
  };

  /** Output directory relative to repo root, default is `packages/${id}` */
  outDir?: string;

  /** Whether to export individual optimized SVGs alongside Iconify packages */
  exportSVGs?: boolean;
}

/**
 * Result of building an icon set.
 */
export interface BuildResult {
  id: string;
  prefix: string;
  totalIcons: number;
  totalAliases: number;
  categories: Record<string, string[]>;
  outDir: string;
  iconSet: IconifyJSON;
  files: string[];
}
