export type CollectionSourceFilter = 'all' | 'hub' | 'upstream';
export type CollectionSortBy = 'name' | 'total';
export type SortOrder = 'asc' | 'desc';

export interface CollectionFilter {
  source: CollectionSourceFilter;
  category?: string;
  search: string;
  sortBy: CollectionSortBy;
  sortOrder: SortOrder;
}

export type ActiveView =
  | { type: 'collections'; filter?: Partial<CollectionFilter> }
  | { type: 'collection-detail'; prefix: string; category?: string; search?: string; page?: number }
  | { type: 'global-search'; query: string; page?: number }
  | { type: 'favorites'; tab: 'icons' | 'sets' };

export interface UpstreamCollectionDetail {
  prefix: string;
  total: number;
  title: string;
  icons: string[];
  categories?: Record<string, string[]>;
  aliases?: Record<string, string>;
}

export interface CollectionAuthor {
  name: string;
  url?: string;
}

export interface CollectionLicense {
  title: string;
  spdx?: string;
  url?: string;
}

export interface CollectionInfo {
  prefix: string;
  name: string;
  total: number;
  author?: CollectionAuthor;
  license?: CollectionLicense;
  version?: string;
  samples?: string[];
  height?: number | number[];
  displayHeight?: number;
  category?: string;
  tags?: string[];
  palette?: boolean;
  isHub: boolean;
}

export interface IconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

export interface IconAlias {
  parent: string;
  hFlip?: boolean;
  vFlip?: boolean;
  rotate?: number;
}

export interface IconSetData {
  prefix: string;
  icons: Record<string, IconData>;
  aliases?: Record<string, IconAlias>;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  lastModified?: number;
}

export interface IconMetadata {
  categories?: Record<string, string[]>;
  aliases?: Record<string, string>;
}

export interface FavoritesState {
  icons: string[]; // Set of "prefix:name"
  sets: string[]; // Set of prefixes
}

export interface FavoritesExport {
  version: 1;
  exportedAt: string;
  icons: string[];
  sets: string[];
}

export type SnippetLanguage =
  | 'react'
  | 'vue'
  | 'svelte'
  | 'unocss'
  | 'svg'
  | 'css';

export type RotationDegree = 0 | 90 | 180 | 270;

export interface IconTransformOptions {
  size: number;
  color: string;
  backgroundColor: string;
  rotate: RotationDegree;
  hFlip: boolean;
  vFlip: boolean;
}

export interface SelectedIcon {
  prefix: string;
  name: string;
  iconData?: IconData;
}
