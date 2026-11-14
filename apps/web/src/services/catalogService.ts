import type { CollectionFilter, CollectionInfo } from '../types/icon';
import { HUB_COLLECTIONS, getHubIconSet, isHubPrefix } from './hubData';
import { fetchUpstreamCollections, searchUpstreamIcons } from './iconifyApi';

export async function getAllCollections(): Promise<CollectionInfo[]> {
  const upstream = await fetchUpstreamCollections();
  // Ensure Hub collections come first and are not duplicated by upstream
  const hubPrefixes = new Set(HUB_COLLECTIONS.map((c) => c.prefix));
  const filteredUpstream = upstream.filter((c) => !hubPrefixes.has(c.prefix));
  return [...HUB_COLLECTIONS, ...filteredUpstream];
}

export function filterCollections(
  collections: CollectionInfo[],
  filter: Partial<CollectionFilter>
): CollectionInfo[] {
  let result = [...collections];

  // 1. Source filter
  if (filter.source === 'hub') {
    result = result.filter((c) => c.isHub);
  } else if (filter.source === 'upstream') {
    result = result.filter((c) => !c.isHub);
  }

  // 2. Category filter
  if (filter.category && filter.category !== 'all') {
    const targetCat = filter.category.toLowerCase();
    result = result.filter(
      (c) => c.category && c.category.toLowerCase() === targetCat
    );
  }

  // 3. Search query
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    result = result.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPrefix = c.prefix.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      const matchAuthor = c.author?.name.toLowerCase().includes(q);
      return matchName || matchPrefix || matchCat || matchAuthor;
    });
  }

  // 4. Sorting
  const sortBy = filter.sortBy || 'name';
  const sortOrder = filter.sortOrder || 'asc';

  result.sort((a, b) => {
    // Keep Hub items at the top if sorting allows, or sort strictly
    if (sortBy === 'total') {
      const diff = b.total - a.total;
      return sortOrder === 'asc' ? -diff : diff;
    } else {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      return sortOrder === 'desc' ? -cmp : cmp;
    }
  });

  return result;
}

export async function searchHubIcons(query: string): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: string[] = [];

  for (const hubCol of HUB_COLLECTIONS) {
    const data = await getHubIconSet(hubCol.prefix);
    if (!data) continue;

    const { iconSet, metadata } = data;
    const prefix = iconSet.prefix;

    // Search in primary icon names
    for (const iconName of Object.keys(iconSet.icons)) {
      if (iconName.toLowerCase().includes(q)) {
        results.push(`${prefix}:${iconName}`);
      }
    }

    // Search in aliases
    if (iconSet.aliases) {
      for (const aliasName of Object.keys(iconSet.aliases)) {
        if (aliasName.toLowerCase().includes(q) && !results.includes(`${prefix}:${aliasName}`)) {
          results.push(`${prefix}:${aliasName}`);
        }
      }
    }

    // Search in categories
    if (metadata.categories) {
      for (const [catName, iconNames] of Object.entries(metadata.categories)) {
        if (catName.toLowerCase().includes(q)) {
          for (const iconName of iconNames) {
            const id = `${prefix}:${iconName}`;
            if (!results.includes(id)) {
              results.push(id);
            }
          }
        }
      }
    }
  }

  return results;
}

export async function searchGlobal(query: string, limit: number = 100): Promise<{ hub: string[]; upstream: string[] }> {
  const clean = query.trim();
  if (!clean) {
    return { hub: [], upstream: [] };
  }

  const [hubMatches, upstreamMatches] = await Promise.all([
    searchHubIcons(clean),
    searchUpstreamIcons(clean, limit),
  ]);

  // Exclude Hub prefixes from upstream matches if any
  const filteredUpstream = upstreamMatches.filter((item) => {
    const [prefix] = item.split(':');
    return !isHubPrefix(prefix);
  });

  return {
    hub: hubMatches.slice(0, limit),
    upstream: filteredUpstream.slice(0, limit),
  };
}
