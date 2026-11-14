import type { FavoritesExport, FavoritesState } from '../types/icon';

const FAVORITES_STORAGE_KEY = 'iconify_hub_favorites_v1';

export function getInitialFavoritesState(): FavoritesState {
  return {
    icons: [],
    sets: [],
  };
}

export function loadFavorites(): FavoritesState {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return getInitialFavoritesState();
    const parsed = JSON.parse(raw);

    const icons = Array.isArray(parsed?.icons)
      ? parsed.icons.filter((i: unknown): i is string => typeof i === 'string' && i.includes(':'))
      : [];

    const sets = Array.isArray(parsed?.sets)
      ? parsed.sets.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0)
      : [];

    return {
      icons: Array.from(new Set(icons)),
      sets: Array.from(new Set(sets)),
    };
  } catch {
    return getInitialFavoritesState();
  }
}

export function saveFavorites(state: FavoritesState): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage might fail if full or disabled
  }
}

export function toggleFavoriteIcon(currentState: FavoritesState, iconId: string): FavoritesState {
  const exists = currentState.icons.includes(iconId);
  const nextIcons = exists
    ? currentState.icons.filter((id) => id !== iconId)
    : [...currentState.icons, iconId];

  const nextState: FavoritesState = {
    ...currentState,
    icons: nextIcons,
  };
  saveFavorites(nextState);
  return nextState;
}

export function toggleFavoriteSet(currentState: FavoritesState, prefix: string): FavoritesState {
  const exists = currentState.sets.includes(prefix);
  const nextSets = exists
    ? currentState.sets.filter((p) => p !== prefix)
    : [...currentState.sets, prefix];

  const nextState: FavoritesState = {
    ...currentState,
    sets: nextSets,
  };
  saveFavorites(nextState);
  return nextState;
}

export function isFavoriteIcon(state: FavoritesState, iconId: string): boolean {
  return state.icons.includes(iconId);
}

export function isFavoriteSet(state: FavoritesState, prefix: string): boolean {
  return state.sets.includes(prefix);
}

export function exportFavoritesAsJson(state: FavoritesState): string {
  const exportData: FavoritesExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    icons: state.icons,
    sets: state.sets,
  };
  return JSON.stringify(exportData, null, 2);
}

export interface ImportResult {
  success: boolean;
  state: FavoritesState;
  importedIconsCount: number;
  importedSetsCount: number;
  error?: string;
}

export function importFavoritesFromJson(jsonString: string, currentState: FavoritesState): ImportResult {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        state: currentState,
        importedIconsCount: 0,
        importedSetsCount: 0,
        error: 'Invalid JSON file format',
      };
    }

    const rawIcons = Array.isArray(parsed.icons) ? parsed.icons : [];
    const rawSets = Array.isArray(parsed.sets) ? parsed.sets : [];

    const validIcons = rawIcons.filter((i: unknown): i is string => typeof i === 'string' && i.includes(':'));
    const validSets = rawSets.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0);

    const mergedIcons = Array.from(new Set([...currentState.icons, ...validIcons]));
    const mergedSets = Array.from(new Set([...currentState.sets, ...validSets]));

    const nextState: FavoritesState = {
      icons: mergedIcons,
      sets: mergedSets,
    };
    saveFavorites(nextState);

    const newIconsCount = mergedIcons.length - currentState.icons.length;
    const newSetsCount = mergedSets.length - currentState.sets.length;

    return {
      success: true,
      state: nextState,
      importedIconsCount: newIconsCount,
      importedSetsCount: newSetsCount,
    };
  } catch (err) {
    return {
      success: false,
      state: currentState,
      importedIconsCount: 0,
      importedSetsCount: 0,
      error: err instanceof Error ? err.message : 'Failed to parse JSON',
    };
  }
}
