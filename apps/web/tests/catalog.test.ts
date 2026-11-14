import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HUB_COLLECTIONS, getHubIconSet, isHubPrefix } from '../src/services/hubData.js';
import { filterCollections, searchHubIcons, searchGlobal } from '../src/services/catalogService.js';
import type { CollectionInfo } from '../src/types/icon.js';

describe('Icon Catalog & Local Hub Integration', () => {
  it('correctly provides GNOME Adwaita and KDE Breeze in HUB_COLLECTIONS', () => {
    assert.equal(HUB_COLLECTIONS.length, 2);

    const adw = HUB_COLLECTIONS.find((c) => c.prefix === 'adw');
    assert.ok(adw, 'GNOME Adwaita collection must exist');
    assert.equal(adw.name, 'GNOME Adwaita');
    assert.equal(adw.total, 641);
    assert.equal(adw.isHub, true);

    const breeze = HUB_COLLECTIONS.find((c) => c.prefix === 'breeze');
    assert.ok(breeze, 'KDE Breeze collection must exist');
    assert.equal(breeze.name, 'KDE Breeze');
    assert.equal(breeze.total, 3422);
    assert.equal(breeze.isHub, true);
  });

  it('correctly identifies Hub prefixes', () => {
    assert.equal(isHubPrefix('adw'), true);
    assert.equal(isHubPrefix('breeze'), true);
    assert.equal(isHubPrefix('lucide'), false);
    assert.equal(isHubPrefix('material-symbols'), false);
  });

  it('loads local Adwaita icon set and metadata categories', async () => {
    const data = await getHubIconSet('adw');
    assert.ok(data, 'Adwaita data must load');
    assert.equal(data.iconSet.prefix, 'adw');
    assert.ok(Object.keys(data.iconSet.icons).length > 600);
    assert.ok(data.iconSet.icons['edit-copy']);
    assert.ok(data.metadata.categories);
    assert.ok(data.metadata.categories['Actions']);
    assert.ok(data.metadata.categories['Actions'].includes('edit-copy'));
  });

  it('loads local Breeze icon set and metadata categories', async () => {
    const data = await getHubIconSet('breeze');
    assert.ok(data, 'Breeze data must load');
    assert.equal(data.iconSet.prefix, 'breeze');
    assert.ok(Object.keys(data.iconSet.icons).length > 3000);
    assert.ok(data.iconSet.icons['document-save']);
    assert.ok(data.metadata.categories);
  });

  it('filters collections by source (all, hub, upstream)', () => {
    const mockCollections: CollectionInfo[] = [
      { prefix: 'adw', name: 'GNOME Adwaita', total: 641, isHub: true, category: 'General' },
      { prefix: 'breeze', name: 'KDE Breeze', total: 3422, isHub: true, category: 'General' },
      { prefix: 'lucide', name: 'Lucide', total: 1400, isHub: false, category: 'General' },
      { prefix: 'tabler', name: 'Tabler', total: 5000, isHub: false, category: 'Web' },
    ];

    const hubOnly = filterCollections(mockCollections, { source: 'hub' });
    assert.equal(hubOnly.length, 2);
    assert.ok(hubOnly.every((c) => c.isHub));

    const upstreamOnly = filterCollections(mockCollections, { source: 'upstream' });
    assert.equal(upstreamOnly.length, 2);
    assert.ok(upstreamOnly.every((c) => !c.isHub));

    const all = filterCollections(mockCollections, { source: 'all' });
    assert.equal(all.length, 4);
  });

  it('filters collections by search text and category, and sorts by count/name', () => {
    const mockCollections: CollectionInfo[] = [
      { prefix: 'adw', name: 'GNOME Adwaita', total: 641, isHub: true, category: 'General' },
      { prefix: 'breeze', name: 'KDE Breeze', total: 3422, isHub: true, category: 'General' },
      { prefix: 'lucide', name: 'Lucide', total: 1400, isHub: false, category: 'General' },
      { prefix: 'tabler', name: 'Tabler', total: 5000, isHub: false, category: 'Web' },
    ];

    const searchResult = filterCollections(mockCollections, { search: 'adwaita' });
    assert.equal(searchResult.length, 1);
    assert.equal(searchResult[0].prefix, 'adw');

    const catResult = filterCollections(mockCollections, { category: 'Web' });
    assert.equal(catResult.length, 1);
    assert.equal(catResult[0].prefix, 'tabler');

    const sortedByCountDesc = filterCollections(mockCollections, { sortBy: 'total', sortOrder: 'desc' });
    assert.equal(sortedByCountDesc[0].prefix, 'tabler');
    assert.equal(sortedByCountDesc[1].prefix, 'breeze');

    const sortedByNameAsc = filterCollections(mockCollections, { sortBy: 'name', sortOrder: 'asc' });
    assert.equal(sortedByNameAsc[0].name, 'GNOME Adwaita');
  });

  it('searches Hub icons locally with high precision', async () => {
    const matches = await searchHubIcons('document-save');
    assert.ok(matches.length > 0);
    assert.ok(matches.some((m) => m.startsWith('adw:') || m.startsWith('breeze:')));
  });

  it('merges Hub and Upstream search results with Hub prioritized', async () => {
    const results = await searchGlobal('copy', 10);
    assert.ok(results.hub.length > 0);
    assert.ok(results.hub.some((m) => m === 'adw:edit-copy' || m === 'breeze:edit-copy'));
  });
});
