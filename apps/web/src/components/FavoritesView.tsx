import React, { useState, useEffect, useRef } from 'react';
import { Star, Download, Upload, Trash2, Layers, Sparkles } from 'lucide-react';
import type { CollectionInfo, FavoritesState, IconData } from '../types/icon';
import { IconCard } from './IconCard';
import { CollectionCard } from './CollectionCard';
import { exportFavoritesAsJson, importFavoritesFromJson } from '../services/favoritesService';
import { getHubIconSet, isHubPrefix } from '../services/hubData';
import { fetchIconsData, getCachedIconData } from '../services/iconifyApi';
import { useToast } from './Toast';

interface FavoritesViewProps {
  favorites: FavoritesState;
  collections: CollectionInfo[];
  activeTab: 'icons' | 'sets';
  onTabChange: (tab: 'icons' | 'sets') => void;
  onToggleFavoriteIcon: (id: string) => void;
  onToggleFavoriteSet: (prefix: string) => void;
  onSelectCollection: (prefix: string) => void;
  onSelectIcon: (prefix: string, name: string, iconData?: IconData) => void;
  onUpdateFavorites: (state: FavoritesState) => void;
  onBrowseCollections: () => void;
}

export function FavoritesView({
  favorites,
  collections,
  activeTab,
  onTabChange,
  onToggleFavoriteIcon,
  onToggleFavoriteSet,
  onSelectCollection,
  onSelectIcon,
  onUpdateFavorites,
  onBrowseCollections,
}: FavoritesViewProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconsMap, setIconsMap] = useState<Record<string, IconData>>({});

  // Load icon data for favorite icons
  useEffect(() => {
    let cancelled = false;

    async function loadFavIcons() {
      const byPrefix: Record<string, string[]> = {};
      for (const id of favorites.icons) {
        const [prefix, name] = id.split(':');
        if (!byPrefix[prefix]) byPrefix[prefix] = [];
        byPrefix[prefix].push(name);
      }

      for (const [prefix, names] of Object.entries(byPrefix)) {
        if (isHubPrefix(prefix)) {
          getHubIconSet(prefix).then((res) => {
            if (!res || cancelled) return;
            const updates: Record<string, IconData> = {};
            for (const name of names) {
              const icon = res.iconSet.icons[name];
              if (icon) updates[`${prefix}:${name}`] = icon;
            }
            setIconsMap((prev) => ({ ...prev, ...updates }));
          });
        } else {
          fetchIconsData(prefix, names).then((fetched) => {
            if (cancelled) return;
            const updates: Record<string, IconData> = {};
            for (const [name, icon] of Object.entries(fetched)) {
              updates[`${prefix}:${name}`] = icon;
            }
            setIconsMap((prev) => ({ ...prev, ...updates }));
          });
        }
      }
    }

    loadFavIcons();
    return () => {
      cancelled = true;
    };
  }, [favorites.icons]);

  // Export JSON handler
  const handleExport = () => {
    const jsonStr = exportFavoritesAsJson(favorites);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iconify-hub-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Favorites exported as JSON');
  };

  // Import JSON handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importFavoritesFromJson(content, favorites);
      if (result.success) {
        onUpdateFavorites(result.state);
        showToast(
          `Imported ${result.importedIconsCount} icons and ${result.importedSetsCount} icon sets`
        );
      } else {
        showToast(result.error || 'Failed to import favorites', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear all favorites
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all your favorites?')) {
      onUpdateFavorites({ icons: [], sets: [] });
      showToast('All favorites cleared', 'info');
    }
  };

  const favoriteCollectionsList = collections.filter((c) =>
    favorites.sets.includes(c.prefix)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-amber-400" />
            Personal Library
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Favorites & Saved Collections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {favorites.icons.length} favorite icons • {favorites.sets.length} favorite icon sets
          </p>
        </div>

        {/* Action buttons: Export, Import, Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
          <button
            onClick={handleExport}
            disabled={favorites.icons.length === 0 && favorites.sets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          {(favorites.icons.length > 0 || favorites.sets.length > 0) && (
            <button
              onClick={handleClear}
              title="Clear all favorites"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => onTabChange('icons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'icons'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className={`w-4 h-4 ${activeTab === 'icons' ? 'fill-white' : ''}`} />
          Favorite Icons ({favorites.icons.length})
        </button>

        <button
          onClick={() => onTabChange('sets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sets'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Favorite Icon Sets ({favorites.sets.length})
        </button>
      </div>

      {/* Tab 1: Favorite Icons */}
      {activeTab === 'icons' && (
        <div>
          {favorites.icons.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {favorites.icons.map((id) => {
                const [prefix, name] = id.split(':');
                const iconData = iconsMap[id] || (isHubPrefix(prefix) ? undefined : getCachedIconData(prefix, name));
                return (
                  <IconCard
                    key={id}
                    prefix={prefix}
                    name={name}
                    iconData={iconData}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavoriteIcon}
                    onClick={() => onSelectIcon(prefix, name, iconData)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Star className="w-12 h-12 mx-auto text-amber-300 dark:text-amber-500/50 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No favorite icons yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Click the star on any icon in GNOME Adwaita, KDE Breeze, or official Iconify collections to save it here for fast access.
              </p>
              <button
                onClick={onBrowseCollections}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Browse Icon Sets
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorite Sets */}
      {activeTab === 'sets' && (
        <div>
          {favoriteCollectionsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteCollectionsList.map((col) => (
                <CollectionCard
                  key={col.prefix}
                  collection={col}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavoriteSet}
                  onClick={() => onSelectCollection(col.prefix)}
                />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Layers className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No favorite icon sets yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Star your favorite collections (like GNOME Adwaita or KDE Breeze) to pin them to your personal favorites dashboard.
              </p>
              <button
                onClick={onBrowseCollections}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Browse Icon Sets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
