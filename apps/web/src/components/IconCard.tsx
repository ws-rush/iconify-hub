import React from 'react';
import { Copy, Star } from 'lucide-react';
import type { IconData } from '../types/icon';
import { renderSvgString } from '../services/renderService';
import { useToast } from './Toast';

interface IconCardProps {
  prefix: string;
  name: string;
  iconData?: IconData;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
}

export function IconCard({
  prefix,
  name,
  iconData,
  isFavorite,
  onToggleFavorite,
  onClick,
}: IconCardProps) {
  const { showToast } = useToast();
  const iconId = `${prefix}:${name}`;

  const handleCopySvg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!iconData) {
      showToast('Icon data not loaded yet', 'error');
      return;
    }
    const svg = renderSvgString(iconData, { size: 24 });
    navigator.clipboard.writeText(svg).then(() => {
      showToast(`Copied SVG for ${iconId}`);
    });
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(iconId);
    showToast(isFavorite ? `Removed ${iconId} from favorites` : `Saved ${iconId} to favorites`);
  };

  const svgHtml = iconData ? renderSvgString(iconData, { size: 32 }) : null;

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5 transition-all cursor-pointer min-h-[110px]"
    >
      {/* Top action buttons (hidden by default, shown on hover/focus or if favorite) */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopySvg}
          title="Copy SVG"
          className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 dark:hover:text-brand-400 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleToggleFav}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}
          className={`p-1 rounded-md bg-slate-100 dark:bg-slate-800 transition-colors ${
            isFavorite
              ? 'text-amber-500 hover:text-amber-600 !opacity-100'
              : 'text-slate-400 hover:text-amber-500'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Always show star badge if favorite when not hovered */}
      {isFavorite && (
        <div className="absolute top-2 right-2 group-hover:hidden text-amber-500">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
        </div>
      )}

      {/* SVG Preview container */}
      <div className="flex-1 flex items-center justify-center w-full py-2">
        {svgHtml ? (
          <div
            className="text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform duration-200"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}
      </div>

      {/* Icon name */}
      <div className="w-full text-center mt-1">
        <span
          title={name}
          className="block text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-full group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
        >
          {name}
        </span>
      </div>
    </div>
  );
}
