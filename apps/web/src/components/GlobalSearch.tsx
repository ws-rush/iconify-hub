import { useState, useEffect } from 'react';
import { Search, Sparkles, Layers } from 'lucide-react';
import type { IconData } from '../types/icon';
import { IconCard } from './IconCard';
import { searchGlobal } from '../services/catalogService';
import { fetchIconsData, getCachedIconData } from '../services/iconifyApi';
import { getHubIconSet, isHubPrefix } from '../services/hubData';

interface GlobalSearchProps {
  query: string;
  favoriteIcons: string[];
  onToggleFavoriteIcon: (id: string) => void;
  onSelectIcon: (prefix: string, name: string, iconData?: IconData) => void;
}

export function GlobalSearch({
  query,
  favoriteIcons,
  onToggleFavoriteIcon,
  onSelectIcon,
}: GlobalSearchProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [hubMatches, setHubMatches] = useState<string[]>([]);
  const [upstreamMatches, setUpstreamMatches] = useState<string[]>([]);
  const [iconsMap, setIconsMap] = useState<Record<string, IconData>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function performSearch() {
      if (!query.trim()) {
        setHubMatches([]);
        setUpstreamMatches([]);
        setLoading(false);
        return;
      }

      const results = await searchGlobal(query.trim(), 120);
      if (cancelled) return;

      setHubMatches(results.hub);
      setUpstreamMatches(results.upstream);
      setLoading(false);

      // Fetch icon data for hub matches
      for (const id of results.hub) {
        const [p, n] = id.split(':');
        getHubIconSet(p).then((res) => {
          if (!res || cancelled) return;
          const icon = res.iconSet.icons[n];
          if (icon) {
            setIconsMap((prev) => ({ ...prev, [id]: icon }));
          }
        });
      }

      // Group upstream matches by prefix and fetch in batches
      const byPrefix: Record<string, string[]> = {};
      for (const id of results.upstream.slice(0, 48)) {
        const [p, n] = id.split(':');
        if (!byPrefix[p]) byPrefix[p] = [];
        byPrefix[p].push(n);
      }

      for (const [p, names] of Object.entries(byPrefix)) {
        fetchIconsData(p, names).then((fetched) => {
          if (cancelled) return;
          const updates: Record<string, IconData> = {};
          for (const [n, icon] of Object.entries(fetched)) {
            updates[`${p}:${n}`] = icon;
          }
          setIconsMap((prev) => ({ ...prev, ...updates }));
        });
      }
    }

    performSearch();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const totalResults = hubMatches.length + upstreamMatches.length;

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold mb-1">
            <Search className="w-3.5 h-3.5" />
            Global Search
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Found {totalResults} icons ({hubMatches.length} in Iconify Hub, {upstreamMatches.length} in upstream collections)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : totalResults === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No icons found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            No icons matched &ldquo;{query}&rdquo;. Try another keyword such as &ldquo;copy&rdquo;, &ldquo;document&rdquo;, &ldquo;folder&rdquo;, or &ldquo;settings&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Iconify Hub Matches */}
          {hubMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Iconify Hub Local ({hubMatches.length})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Instant offline access from GNOME Adwaita & KDE Breeze
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {hubMatches.map((id) => {
                  const [prefix, name] = id.split(':');
                  const iconData = iconsMap[id];
                  return (
                    <IconCard
                      key={id}
                      prefix={prefix}
                      name={name}
                      iconData={iconData}
                      isFavorite={favoriteIcons.includes(id)}
                      onToggleFavorite={onToggleFavoriteIcon}
                      onClick={() => onSelectIcon(prefix, name, iconData)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Upstream Iconify Matches */}
          {upstreamMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5" />
                  Upstream Iconify ({upstreamMatches.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {upstreamMatches.map((id) => {
                  const [prefix, name] = id.split(':');
                  const iconData = iconsMap[id] || (isHubPrefix(prefix) ? undefined : getCachedIconData(prefix, name));
                  return (
                    <IconCard
                      key={id}
                      prefix={prefix}
                      name={name}
                      iconData={iconData}
                      isFavorite={favoriteIcons.includes(id)}
                      onToggleFavorite={onToggleFavoriteIcon}
                      onClick={() => onSelectIcon(prefix, name, iconData)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
