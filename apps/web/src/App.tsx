import { useState, useEffect } from 'react';
import type { ActiveView, CollectionInfo, FavoritesState, SelectedIcon } from './types/icon';
import { Header } from './components/Header';
import { CollectionList } from './components/CollectionList';
import { CollectionDetail } from './components/CollectionDetail';
import { GlobalSearch } from './components/GlobalSearch';
import { FavoritesView } from './components/FavoritesView';
import { IconDetailModal } from './components/IconDetailModal';
import { ToastProvider } from './components/Toast';
import { getAllCollections } from './services/catalogService';
import {
  loadFavorites,
  toggleFavoriteIcon,
  toggleFavoriteSet,
} from './services/favoritesService';
import { HUB_COLLECTIONS, getHubIconSet, isHubPrefix } from './services/hubData';
import { fetchIconsData, getCachedIconData } from './services/iconifyApi';

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('iconify_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('iconify_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('iconify_theme', 'light');
    }
  }, [darkMode]);

  // Active view state machine
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'collections' });

  // Collections state
  const [collections, setCollections] = useState<CollectionInfo[]>(HUB_COLLECTIONS);

  // Favorites state
  const [favorites, setFavorites] = useState<FavoritesState>(() => loadFavorites());

  // Modal selected icon
  const [selectedIcon, setSelectedIcon] = useState<SelectedIcon | null>(null);

  // Load all collections on startup
  useEffect(() => {
    getAllCollections().then((all) => {
      setCollections(all);
    });
  }, []);

  // Handlers for favorites
  const handleToggleFavIcon = (iconId: string) => {
    setFavorites((prev) => toggleFavoriteIcon(prev, iconId));
  };

  const handleToggleFavSet = (prefix: string) => {
    setFavorites((prev) => toggleFavoriteSet(prev, prefix));
  };

  // Handler for selecting an icon to inspect/export
  const handleSelectIcon = async (prefix: string, name: string, initialIconData?: SelectedIcon['iconData']) => {
    setSelectedIcon({ prefix, name, iconData: initialIconData });

    if (!initialIconData) {
      if (isHubPrefix(prefix)) {
        const hubRes = await getHubIconSet(prefix);
        if (hubRes) {
          const icon = hubRes.iconSet.icons[name];
          if (icon) {
            setSelectedIcon({ prefix, name, iconData: icon });
          }
        }
      } else {
        const cached = getCachedIconData(prefix, name);
        if (cached) {
          setSelectedIcon({ prefix, name, iconData: cached });
        } else {
          const fetched = await fetchIconsData(prefix, [name]);
          if (fetched[name]) {
            setSelectedIcon({ prefix, name, iconData: fetched[name] });
          }
        }
      }
    }
  };

  // Find active collection object if inside collection-detail
  const activeCollection =
    activeView.type === 'collection-detail'
      ? collections.find((c) => c.prefix === activeView.prefix) || {
          prefix: activeView.prefix,
          name: activeView.prefix,
          total: 0,
          isHub: isHubPrefix(activeView.prefix),
        }
      : null;

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          favorites={favorites}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onGlobalSearch={(q) => setActiveView({ type: 'global-search', query: q })}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* View 1: Collection Catalog */}
          {activeView.type === 'collections' && (
            <CollectionList
              collections={collections}
              favoriteSets={favorites.sets}
              onToggleFavoriteSet={handleToggleFavSet}
              onSelectCollection={(prefix) =>
                setActiveView({ type: 'collection-detail', prefix })
              }
            />
          )}

          {/* View 2: Collection Detail (Icons grid) */}
          {activeView.type === 'collection-detail' && activeCollection && (
            <CollectionDetail
              collection={activeCollection}
              favoriteIcons={favorites.icons}
              favoriteSets={favorites.sets}
              initialCategory={activeView.category}
              initialSearch={activeView.search}
              onBack={() => setActiveView({ type: 'collections' })}
              onToggleFavoriteIcon={handleToggleFavIcon}
              onToggleFavoriteSet={handleToggleFavSet}
              onSelectIcon={handleSelectIcon}
            />
          )}

          {/* View 3: Global Search Results */}
          {activeView.type === 'global-search' && (
            <GlobalSearch
              query={activeView.query}
              favoriteIcons={favorites.icons}
              onToggleFavoriteIcon={handleToggleFavIcon}
              onSelectIcon={handleSelectIcon}
            />
          )}

          {/* View 4: Favorites Library */}
          {activeView.type === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              collections={collections}
              activeTab={activeView.tab}
              onTabChange={(tab) => setActiveView({ type: 'favorites', tab })}
              onToggleFavoriteIcon={handleToggleFavIcon}
              onToggleFavoriteSet={handleToggleFavSet}
              onSelectCollection={(prefix) =>
                setActiveView({ type: 'collection-detail', prefix })
              }
              onSelectIcon={handleSelectIcon}
              onUpdateFavorites={setFavorites}
              onBrowseCollections={() => setActiveView({ type: 'collections' })}
            />
          )}
        </main>

        {/* Icon Inspection & Code Export Modal */}
        {selectedIcon && (
          <IconDetailModal
            prefix={selectedIcon.prefix}
            name={selectedIcon.name}
            iconData={selectedIcon.iconData}
            isFavorite={favorites.icons.includes(
              `${selectedIcon.prefix}:${selectedIcon.name}`
            )}
            onToggleFavorite={handleToggleFavIcon}
            onClose={() => setSelectedIcon(null)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
export default App;
