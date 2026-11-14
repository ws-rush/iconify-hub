import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Star, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import type { CollectionInfo, IconData, IconSetData, IconMetadata } from '../types/icon';
import { IconCard } from './IconCard';
import { getHubIconSet, isHubPrefix } from '../services/hubData';
import { fetchIconsData, getCachedIconData, fetchUpstreamCollectionDetail } from '../services/iconifyApi';
import { useToast } from './Toast';

interface CollectionDetailProps {
  collection: CollectionInfo;
  favoriteIcons: string[];
  favoriteSets: string[];
  initialCategory?: string;
  initialSearch?: string;
  onBack: () => void;
  onToggleFavoriteIcon: (id: string) => void;
  onToggleFavoriteSet: (prefix: string) => void;
  onSelectIcon: (prefix: string, name: string, iconData?: IconData) => void;
}

const ITEMS_PER_PAGE = 72;

export function CollectionDetail({
  collection,
  favoriteIcons,
  favoriteSets,
  initialCategory,
  initialSearch,
  onBack,
  onToggleFavoriteIcon,
  onToggleFavoriteSet,
  onSelectIcon,
}: CollectionDetailProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [iconSetData, setIconSetData] = useState<IconSetData | null>(null);
  const [metadata, setMetadata] = useState<IconMetadata | null>(null);

  // Upstream icon names list if upstream collection
  const [upstreamIconNames, setUpstreamIconNames] = useState<string[]>([]);
  // Loaded icon data map: name -> IconData
  const [iconsMap, setIconsMap] = useState<Record<string, IconData>>({});

  const prefix = collection.prefix;
  const isHub = isHubPrefix(prefix);
  const isFavSet = favoriteSets.includes(prefix);

  // Load set data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadData() {
      if (isHub) {
        const hubRes = await getHubIconSet(prefix);
        if (cancelled || !hubRes) return;
        setIconSetData(hubRes.iconSet);
        setMetadata(hubRes.metadata);
        setIconsMap(hubRes.iconSet.icons);
        setLoading(false);
      } else {
        // Upstream collection: fetch full icon list and categories
        try {
          const detail = await fetchUpstreamCollectionDetail(prefix);
          if (cancelled) return;

          if (detail && detail.icons.length > 0) {
            setUpstreamIconNames(detail.icons);
            if (detail.categories) {
              setMetadata({ categories: detail.categories, aliases: detail.aliases });
            }
            // Fetch first page of icon data
            const initialBatch = detail.icons.slice(0, ITEMS_PER_PAGE);
            const fetched = await fetchIconsData(prefix, initialBatch);
            if (cancelled) return;
            setIconsMap(fetched);
          } else {
            // Fallback to samples if detail endpoint fails
            const sampleList = collection.samples || [];
            setUpstreamIconNames(sampleList);
            const fetched = await fetchIconsData(prefix, sampleList);
            if (cancelled) return;
            setIconsMap(fetched);
          }
        } catch {
          const sampleList = collection.samples || [];
          setUpstreamIconNames(sampleList);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [prefix, isHub, collection.samples]);

  // Categories list
  const categoriesList = useMemo(() => {
    if (metadata?.categories) {
      return Object.keys(metadata.categories).sort();
    }
    return [];
  }, [metadata]);

  // All icon names for this set
  const allIconNames = useMemo(() => {
    if (isHub && iconSetData) {
      const primaryNames = Object.keys(iconSetData.icons);
      const aliasNames = iconSetData.aliases ? Object.keys(iconSetData.aliases) : [];
      return Array.from(new Set([...primaryNames, ...aliasNames])).sort();
    }
    return upstreamIconNames;
  }, [isHub, iconSetData, upstreamIconNames]);

  // Filtered icon names based on search and category
  const filteredIconNames = useMemo(() => {
    let list = allIconNames;

    // Filter by category
    if (selectedCategory !== 'all' && metadata?.categories) {
      const catIcons = new Set(metadata.categories[selectedCategory] || []);
      list = list.filter((name) => catIcons.has(name));
    }

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((name) => name.toLowerCase().includes(q));
    }

    return list;
  }, [allIconNames, selectedCategory, metadata, searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredIconNames.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated slice
  const pageIcons = useMemo(() => {
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredIconNames.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIconNames, validPage]);

  // For upstream, fetch icons data for visible page if not in memory
  useEffect(() => {
    if (isHub || pageIcons.length === 0) return;

    const missing = pageIcons.filter((name) => !iconsMap[name] && !getCachedIconData(prefix, name));
    if (missing.length === 0) return;

    let active = true;
    fetchIconsData(prefix, missing).then((fetched) => {
      if (!active) return;
      setIconsMap((prev) => ({ ...prev, ...fetched }));
    });

    return () => {
      active = false;
    };
  }, [isHub, prefix, pageIcons, iconsMap]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mt-0.5"
              aria-label="Back to collections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {collection.name}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {collection.prefix}
                </span>
                {isHub && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-500 to-indigo-600 text-white">
                    <Sparkles className="w-3 h-3" />
                    Iconify Hub Local
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {collection.author && (
                  <span>
                    By{' '}
                    {collection.author.url ? (
                      <a
                        href={collection.author.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-slate-700 dark:text-slate-300 inline-flex items-center gap-0.5"
                      >
                        {collection.author.name}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      collection.author.name
                    )}
                  </span>
                )}
                {collection.license && (
                  <span>License: {collection.license.title}</span>
                )}
                {collection.version && (
                  <span className="font-mono">v{collection.version}</span>
                )}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {collection.total.toLocaleString()} total icons
                </span>
              </div>
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={() => {
              onToggleFavoriteSet(prefix);
              showToast(
                isFavSet
                  ? `Removed ${collection.name} from favorite sets`
                  : `Saved ${collection.name} to favorite sets`
              );
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isFavSet
                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavSet ? 'fill-white' : ''}`} />
            <span>{isFavSet ? 'Favorited Set' : 'Favorite Set'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Search within set + category pills) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search inside collection */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${collection.name} icons...`}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Count summary */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between sm:justify-end gap-2">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredIconNames.length}</strong> icons
            </span>
          </div>
        </div>

        {/* Category Pills (Adwaita, Breeze, etc.) */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({metadata?.categories?.[cat]?.length || 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Icons */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : pageIcons.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {pageIcons.map((iconName) => {
            const iconId = `${prefix}:${iconName}`;
            const iconData = iconsMap[iconName] || getCachedIconData(prefix, iconName);
            return (
              <IconCard
                key={iconName}
                prefix={prefix}
                name={iconName}
                iconData={iconData}
                isFavorite={favoriteIcons.includes(iconId)}
                onToggleFavorite={onToggleFavoriteIcon}
                onClick={() => onSelectIcon(prefix, iconName, iconData)}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No icons match your search</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try a different search term or select another category.
          </p>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-800 dark:text-slate-200">{validPage}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
