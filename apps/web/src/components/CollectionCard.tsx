import React from 'react';
import { Star, ExternalLink, Sparkles, Layers } from 'lucide-react';
import type { CollectionInfo } from '../types/icon';
import { useToast } from './Toast';

interface CollectionCardProps {
  collection: CollectionInfo;
  isFavorite: boolean;
  onToggleFavorite: (prefix: string) => void;
  onClick: () => void;
}

export function CollectionCard({
  collection,
  isFavorite,
  onToggleFavorite,
  onClick,
}: CollectionCardProps) {
  const { showToast } = useToast();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(collection.prefix);
    showToast(
      isFavorite
        ? `Removed ${collection.name} from favorite sets`
        : `Saved ${collection.name} to favorite sets`
    );
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
        collection.isHub
          ? 'bg-gradient-to-b from-brand-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900 border-brand-500/30 hover:border-brand-500 shadow-sm hover:shadow-lg hover:shadow-brand-500/10'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      <div>
        {/* Top Badges & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {collection.isHub ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-xs">
                <Sparkles className="w-3 h-3" />
                Iconify Hub
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Upstream
              </span>
            )}
            {collection.category && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                {collection.category}
              </span>
            )}
          </div>

          <button
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Collection Name & Prefix */}
        <div className="mb-2">
          <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-2">
            {collection.name}
            <span className="font-mono text-xs font-normal text-slate-400 dark:text-slate-500">
              ({collection.prefix})
            </span>
          </h3>
        </div>

        {/* Author & License */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
          {collection.author && (
            <span className="flex items-center gap-1">
              by{' '}
              {collection.author.url ? (
                <a
                  href={collection.author.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline text-slate-700 dark:text-slate-300 inline-flex items-center gap-0.5"
                >
                  {collection.author.name}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ) : (
                <span className="text-slate-700 dark:text-slate-300">{collection.author.name}</span>
              )}
            </span>
          )}
          {collection.license && (
            <span className="text-slate-400 dark:text-slate-500">
              {collection.license.title}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Icon count and sample names / visual preview */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>{collection.total.toLocaleString()} icons</span>
        </div>

        {collection.version && (
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            v{collection.version}
          </span>
        )}
      </div>
    </div>
  );
}
