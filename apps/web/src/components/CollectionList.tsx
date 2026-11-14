import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Sparkles, Layers } from 'lucide-react';
import type { CollectionFilter, CollectionInfo, CollectionSourceFilter, CollectionSortBy, SortOrder } from '../types/icon';
import { CollectionCard } from './CollectionCard';
import { filterCollections } from '../services/catalogService';

interface CollectionListProps {
  collections: CollectionInfo[];
  favoriteSets: string[];
  onToggleFavoriteSet: (prefix: string) => void;
  onSelectCollection: (prefix: string) => void;
}

export function CollectionList({
  collections,
  favoriteSets,
  onToggleFavoriteSet,
  onSelectCollection,
}: CollectionListProps) {
  const [sourceFilter, setSourceFilter] = useState<CollectionSourceFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<CollectionSortBy>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Compute unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [collections]);

  // Filtered collections
  const filtered = useMemo(() => {
    const filter: CollectionFilter = {
      source: sourceFilter,
      category: selectedCategory,
      search: searchTerm,
      sortBy,
      sortOrder,
    };
    return filterCollections(collections, filter);
  }, [collections, sourceFilter, selectedCategory, searchTerm, sortBy, sortOrder]);

  const hubCount = collections.filter((c) => c.isHub).length;
  const upstreamCount = collections.filter((c) => !c.isHub).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Unofficial & Upstream Iconify Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Explore 280+ Icon Collections
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Directly browse local <span className="text-brand-300 font-semibold">GNOME Adwaita (641 icons)</span> and{' '}
            <span className="text-brand-300 font-semibold">KDE Breeze (3,422 icons)</span> packages with zero network lag, plus hundreds of official upstream Iconify collections.
          </p>
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Source Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              sourceFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({collections.length})
          </button>
          <button
            onClick={() => setSourceFilter('hub')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              sourceFilter === 'hub'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'
            }`}
          >
            <Sparkles className="w-3 h-3 text-brand-500" />
            Iconify Hub ({hubCount})
          </button>
          <button
            onClick={() => setSourceFilter('upstream')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              sourceFilter === 'upstream'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Upstream ({upstreamCount})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search set input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter sets..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [CollectionSortBy, SortOrder];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="total-desc">Most Icons</option>
              <option value="total-asc">Fewest Icons</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Collection Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((col) => (
            <CollectionCard
              key={col.prefix}
              collection={col}
              isFavorite={favoriteSets.includes(col.prefix)}
              onToggleFavorite={onToggleFavoriteSet}
              onClick={() => onSelectCollection(col.prefix)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No collections match your filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or switching to &ldquo;All&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
