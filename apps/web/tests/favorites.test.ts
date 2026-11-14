import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleFavoriteIcon,
  toggleFavoriteSet,
  isFavoriteIcon,
  isFavoriteSet,
  exportFavoritesAsJson,
  importFavoritesFromJson,
  getInitialFavoritesState,
} from '../src/services/favoritesService.js';
import type { FavoritesState } from '../src/types/icon.js';

describe('Favorites Engine', () => {
  let state: FavoritesState;

  beforeEach(() => {
    state = getInitialFavoritesState();
  });

  it('toggles favorite icon idempotently and preserves unique set', () => {
    assert.equal(isFavoriteIcon(state, 'adw:edit-copy'), false);

    // Add icon
    state = toggleFavoriteIcon(state, 'adw:edit-copy');
    assert.equal(isFavoriteIcon(state, 'adw:edit-copy'), true);
    assert.deepEqual(state.icons, ['adw:edit-copy']);

    // Add another icon
    state = toggleFavoriteIcon(state, 'breeze:folder');
    assert.equal(isFavoriteIcon(state, 'breeze:folder'), true);
    assert.equal(state.icons.length, 2);

    // Remove first icon
    state = toggleFavoriteIcon(state, 'adw:edit-copy');
    assert.equal(isFavoriteIcon(state, 'adw:edit-copy'), false);
    assert.deepEqual(state.icons, ['breeze:folder']);
  });

  it('toggles favorite icon set', () => {
    assert.equal(isFavoriteSet(state, 'adw'), false);

    state = toggleFavoriteSet(state, 'adw');
    assert.equal(isFavoriteSet(state, 'adw'), true);
    assert.deepEqual(state.sets, ['adw']);

    state = toggleFavoriteSet(state, 'adw');
    assert.equal(isFavoriteSet(state, 'adw'), false);
    assert.deepEqual(state.sets, []);
  });

  it('exports and imports favorites JSON with boundary validation', () => {
    state = {
      icons: ['adw:edit-copy', 'breeze:document-save'],
      sets: ['adw', 'breeze'],
    };

    const exportedJson = exportFavoritesAsJson(state);
    const parsed = JSON.parse(exportedJson);

    assert.equal(parsed.version, 1);
    assert.ok(parsed.exportedAt);
    assert.deepEqual(parsed.icons, ['adw:edit-copy', 'breeze:document-save']);
    assert.deepEqual(parsed.sets, ['adw', 'breeze']);

    // Import into fresh state
    const emptyState = getInitialFavoritesState();
    const importResult = importFavoritesFromJson(exportedJson, emptyState);

    assert.equal(importResult.success, true);
    assert.equal(importResult.importedIconsCount, 2);
    assert.equal(importResult.importedSetsCount, 2);
    assert.deepEqual(importResult.state.icons, ['adw:edit-copy', 'breeze:document-save']);
    assert.deepEqual(importResult.state.sets, ['adw', 'breeze']);
  });

  it('gracefully handles invalid JSON on import', () => {
    const res = importFavoritesFromJson('{ invalid json syntax', state);
    assert.equal(res.success, false);
    assert.ok(res.error);
    assert.deepEqual(res.state, state);
  });

  it('filters out invalid icon and set formats on import', () => {
    const maliciousJson = JSON.stringify({
      version: 1,
      icons: ['valid:icon', 123, null, 'invalid-no-colon', 'another:valid'],
      sets: ['set-a', '', 456],
    });

    const res = importFavoritesFromJson(maliciousJson, state);
    assert.equal(res.success, true);
    assert.deepEqual(res.state.icons, ['valid:icon', 'another:valid']);
    assert.deepEqual(res.state.sets, ['set-a']);
  });
});
