import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUpstreamCollectionDetail } from '../src/services/iconifyApi.js';

describe('Upstream Collection Full Icons Loader', () => {
  it('loads all icon names and categories for upstream collection instead of only samples', async () => {
    const detail = await fetchUpstreamCollectionDetail('lucide');
    assert.ok(detail, 'Upstream collection detail must be loaded');
    assert.equal(detail.prefix, 'lucide');
    assert.ok(detail.total > 1000, 'Total icons must be greater than 1000');
    // Must return all thousands of icon names, not just 5-6 sample icons
    assert.ok(detail.icons.length > 1000, `Expected > 1000 icons, got ${detail.icons.length}`);
    assert.ok(detail.icons.includes('alarm-clock'));
    assert.ok(detail.icons.includes('arrow-right'));
    assert.ok(detail.icons.includes('activity'));
  });

  it('correctly extracts categories for upstream collection', async () => {
    const detail = await fetchUpstreamCollectionDetail('tabler');
    assert.ok(detail, 'Tabler collection detail must be loaded');
    assert.equal(detail.prefix, 'tabler');
    assert.ok(detail.icons.length > 3000, `Expected > 3000 icons, got ${detail.icons.length}`);
    assert.ok(detail.icons.includes('accessible'));
  });
});
