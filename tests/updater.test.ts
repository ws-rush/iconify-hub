import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLatestGitTag, checkUpstream } from '../src/updater.js';
import { breezeSet } from '../src/sets/breeze.js';

describe('Upstream Checker', () => {
  test('fetches and sorts latest git tag for Breeze repo', async () => {
    const latest = await getLatestGitTag(breezeSet.source.url, breezeSet.source.tagPattern);
    assert.ok(latest, 'found latest tag');
    assert.match(latest, /^v6\.\d+\.\d+$/, 'matches Breeze v6 semver format');
  });

  test('checks upstream status of registered set', async () => {
    const res = await checkUpstream(breezeSet);
    assert.equal(res.id, 'breeze');
    assert.equal(typeof res.hasUpdate, 'boolean');
    assert.ok(res.latestRef.startsWith('v6.'));
  });
});
