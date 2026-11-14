import type { CollectionInfo, IconData, IconSetData, UpstreamCollectionDetail } from '../types/icon';

const API_BASE = 'https://api.iconify.design';
const COLLECTIONS_CACHE_KEY = 'iconify_collections_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback collections if offline or network fails
const FALLBACK_COLLECTIONS: CollectionInfo[] = [
  {
    prefix: 'lucide',
    name: 'Lucide',
    total: 1480,
    author: { name: 'Lucide Contributors', url: 'https://lucide.dev' },
    license: { title: 'ISC', spdx: 'ISC' },
    category: 'General',
    samples: ['home', 'user', 'settings', 'search', 'bell'],
    isHub: false,
  },
  {
    prefix: 'material-symbols',
    name: 'Material Symbols',
    total: 15810,
    author: { name: 'Google', url: 'https://github.com/google/material-design-icons' },
    license: { title: 'Apache 2.0', spdx: 'Apache-2.0' },
    category: 'Material',
    samples: ['downloading', 'privacy-tip', 'home', 'settings'],
    isHub: false,
  },
  {
    prefix: 'tabler',
    name: 'Tabler Icons',
    total: 5460,
    author: { name: 'Paweł Kuna', url: 'https://tabler-icons.io/' },
    license: { title: 'MIT', spdx: 'MIT' },
    category: 'General',
    samples: ['activity', 'alarm', 'brand-github', 'brand-react'],
    isHub: false,
  },
  {
    prefix: 'ph',
    name: 'Phosphor',
    total: 9072,
    author: { name: 'Phosphor Icons', url: 'https://phosphoricons.com/' },
    license: { title: 'MIT', spdx: 'MIT' },
    category: 'General',
    samples: ['house', 'magnifying-glass', 'gear', 'user'],
    isHub: false,
  },
  {
    prefix: 'heroicons',
    name: 'Heroicons',
    total: 1152,
    author: { name: 'Tailwind Labs', url: 'https://heroicons.com/' },
    license: { title: 'MIT', spdx: 'MIT' },
    category: 'General',
    samples: ['academic-cap', 'archive-box', 'heart', 'sparkles'],
    isHub: false,
  },
];

interface CachedCollectionsPayload {
  timestamp: number;
  data: CollectionInfo[];
}

export async function fetchUpstreamCollections(): Promise<CollectionInfo[]> {
  // Check localStorage cache
  try {
    const raw = localStorage.getItem(COLLECTIONS_CACHE_KEY);
    if (raw) {
      const parsed: CachedCollectionsPayload = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data) && parsed.data.length > 0) {
        // Return cached, refresh in background if connected
        refreshCollectionsInBackground();
        return parsed.data;
      }
    }
  } catch {
    // Ignore cache read errors
  }

  try {
    const response = await fetch(`${API_BASE}/collections`);
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: HTTP ${response.status}`);
    }
    const raw = await response.json();
    const list: CollectionInfo[] = Object.entries(raw).map(([prefix, info]: [string, any]) => ({
      prefix,
      name: typeof info.name === 'string' ? info.name : prefix,
      total: typeof info.total === 'number' ? info.total : 0,
      author: info.author,
      license: info.license,
      version: info.version,
      samples: Array.isArray(info.samples) ? info.samples : [],
      height: info.height,
      displayHeight: info.displayHeight,
      category: typeof info.category === 'string' ? info.category : 'General',
      tags: Array.isArray(info.tags) ? info.tags : undefined,
      palette: typeof info.palette === 'boolean' ? info.palette : undefined,
      isHub: false,
    }));

    try {
      const payload: CachedCollectionsPayload = {
        timestamp: Date.now(),
        data: list,
      };
      localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Storage might be full
    }

    return list;
  } catch {
    // Network failure: fallback to cached or static
    try {
      const raw = localStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (raw) {
        const parsed: CachedCollectionsPayload = JSON.parse(raw);
        if (Array.isArray(parsed.data) && parsed.data.length > 0) {
          return parsed.data;
        }
      }
    } catch {
      // Ignore
    }
    return FALLBACK_COLLECTIONS;
  }
}

async function refreshCollectionsInBackground(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/collections`);
    if (!response.ok) return;
    const raw = await response.json();
    const list: CollectionInfo[] = Object.entries(raw).map(([prefix, info]: [string, any]) => ({
      prefix,
      name: typeof info.name === 'string' ? info.name : prefix,
      total: typeof info.total === 'number' ? info.total : 0,
      author: info.author,
      license: info.license,
      version: info.version,
      samples: Array.isArray(info.samples) ? info.samples : [],
      height: info.height,
      displayHeight: info.displayHeight,
      category: typeof info.category === 'string' ? info.category : 'General',
      tags: Array.isArray(info.tags) ? info.tags : undefined,
      palette: typeof info.palette === 'boolean' ? info.palette : undefined,
      isHub: false,
    }));
    const payload: CachedCollectionsPayload = {
      timestamp: Date.now(),
      data: list,
    };
    localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Background refresh silently fails
  }
}

export async function searchUpstreamIcons(query: string, limit: number = 64): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query.trim())}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.icons)) {
      return data.icons as string[];
    }
    return [];
  } catch {
    return [];
  }
}

const DETAIL_CACHE_PREFIX = 'iconify_detail_cache_';

export async function fetchUpstreamCollectionDetail(prefix: string): Promise<UpstreamCollectionDetail | null> {
  const cacheKey = `${DETAIL_CACHE_PREFIX}${prefix}`;
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data && Array.isArray(parsed.data.icons)) {
        return parsed.data as UpstreamCollectionDetail;
      }
    }
  } catch {
    // Ignore cache read errors
  }

  try {
    const res = await fetch(`${API_BASE}/collection?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch collection detail for ${prefix}: HTTP ${res.status}`);
    }
    const raw = await res.json();
    const iconSet = new Set<string>();

    if (Array.isArray(raw.uncategorized)) {
      for (const name of raw.uncategorized) {
        if (typeof name === 'string' && name.trim()) iconSet.add(name.trim());
      }
    }
    if (raw.categories && typeof raw.categories === 'object') {
      for (const list of Object.values(raw.categories)) {
        if (Array.isArray(list)) {
          for (const name of list) {
            if (typeof name === 'string' && name.trim()) iconSet.add(name.trim());
          }
        }
      }
    }
    if (raw.aliases && typeof raw.aliases === 'object') {
      for (const name of Object.keys(raw.aliases)) {
        if (typeof name === 'string' && name.trim()) iconSet.add(name.trim());
      }
    }

    const detail: UpstreamCollectionDetail = {
      prefix,
      total: typeof raw.total === 'number' ? raw.total : iconSet.size,
      title: typeof raw.title === 'string' ? raw.title : prefix,
      icons: Array.from(iconSet).sort(),
      categories: raw.categories && typeof raw.categories === 'object' ? raw.categories : undefined,
      aliases: raw.aliases && typeof raw.aliases === 'object' ? raw.aliases : undefined,
    };

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: detail })
      );
    } catch {
      // Storage might be full
    }

    return detail;
  } catch {
    // Return cached if available even if stale
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed.data && Array.isArray(parsed.data.icons)) {
          return parsed.data as UpstreamCollectionDetail;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

// In-memory icon cache: `prefix:iconName` -> IconData
const iconDataCache = new Map<string, IconData>();

export async function fetchIconsData(prefix: string, iconNames: string[]): Promise<Record<string, IconData>> {
  const result: Record<string, IconData> = {};
  const missing: string[] = [];

  for (const name of iconNames) {
    const key = `${prefix}:${name}`;
    const cached = iconDataCache.get(key);
    if (cached) {
      result[name] = cached;
    } else {
      missing.push(name);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  // Batch in chunks of 50 to avoid URL length issues
  const chunkSize = 50;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    try {
      const res = await fetch(`${API_BASE}/${prefix}.json?icons=${chunk.join(',')}`);
      if (res.ok) {
        const data: IconSetData = await res.json();
        if (data.icons) {
          for (const [name, icon] of Object.entries(data.icons)) {
            const fullIcon: IconData = {
              ...icon,
              width: icon.width ?? data.width,
              height: icon.height ?? data.height,
            };
            iconDataCache.set(`${prefix}:${name}`, fullIcon);
            result[name] = fullIcon;
          }
        }
        if (data.aliases) {
          for (const [aliasName, aliasInfo] of Object.entries(data.aliases)) {
            const parentIcon = result[aliasInfo.parent] || iconDataCache.get(`${prefix}:${aliasInfo.parent}`);
            if (parentIcon) {
              const fullIcon: IconData = {
                ...parentIcon,
                hFlip: aliasInfo.hFlip ?? parentIcon.hFlip,
                vFlip: aliasInfo.vFlip ?? parentIcon.vFlip,
                rotate: aliasInfo.rotate ?? parentIcon.rotate,
              };
              iconDataCache.set(`${prefix}:${aliasName}`, fullIcon);
              result[aliasName] = fullIcon;
            }
          }
        }
      }
    } catch {
      // Chunk request failed, continue with others
    }
  }

  return result;
}

export function cacheIconData(prefix: string, name: string, icon: IconData): void {
  iconDataCache.set(`${prefix}:${name}`, icon);
}

export function getCachedIconData(prefix: string, name: string): IconData | undefined {
  return iconDataCache.get(`${prefix}:${name}`);
}
