import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Download,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Star,
  Check,
  Sparkles,
} from 'lucide-react';
import type { IconData, IconTransformOptions, RotationDegree, SnippetLanguage } from '../types/icon';
import {
  getDefaultTransformOptions,
  renderSvgString,
  generateSnippet,
  downloadSvgFile,
} from '../services/renderService';
import { isHubPrefix } from '../services/hubData';
import { useToast } from './Toast';

interface IconDetailModalProps {
  prefix: string;
  name: string;
  iconData?: IconData;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}

const SNIPPET_TABS: { id: SnippetLanguage; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'unocss', label: 'UnoCSS' },
  { id: 'svg', label: 'HTML SVG' },
  { id: 'css', label: 'CSS / Mask' },
];

const COLOR_PRESETS = [
  { label: 'Current', value: 'currentColor' },
  { label: 'Dark', value: '#1e293b' },
  { label: 'White', value: '#ffffff' },
  { label: 'Blue', value: '#0284c7' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
];

export function IconDetailModal({
  prefix,
  name,
  iconData,
  isFavorite,
  onToggleFavorite,
  onClose,
}: IconDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SnippetLanguage>('react');
  const [transform, setTransform] = useState<IconTransformOptions>(getDefaultTransformOptions());
  const [copied, setCopied] = useState(false);
  const [bgChoice, setBgChoice] = useState<'checker' | 'white' | 'dark' | 'transparent'>('checker');

  const iconId = `${prefix}:${name}`;
  const isHub = isHubPrefix(prefix);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Rotate cycle: 0 -> 90 -> 180 -> 270 -> 0
  const handleRotate = () => {
    const nextRotate: Record<RotationDegree, RotationDegree> = {
      0: 90,
      90: 180,
      180: 270,
      270: 0,
    };
    setTransform((prev) => ({ ...prev, rotate: nextRotate[prev.rotate] }));
  };

  const handleFlipH = () => {
    setTransform((prev) => ({ ...prev, hFlip: !prev.hFlip }));
  };

  const handleFlipV = () => {
    setTransform((prev) => ({ ...prev, vFlip: !prev.vFlip }));
  };

  // Render SVG string for preview
  const previewSvg = useMemo(() => {
    if (!iconData) return '';
    return renderSvgString(iconData, transform);
  }, [iconData, transform]);

  // Current snippet code
  const currentSnippet = useMemo(() => {
    return generateSnippet(activeTab, prefix, name, iconData, transform);
  }, [activeTab, prefix, name, iconData, transform]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSnippet).then(() => {
      setCopied(true);
      showToast(`Copied ${activeTab.toUpperCase()} snippet!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadSvg = () => {
    if (!iconData) return;
    const cleanSvg = renderSvgString(iconData, {
      ...transform,
      // For download, default to currentColor or selected custom color
      size: transform.size || 32,
    });
    downloadSvgFile(cleanSvg, `${prefix}-${name}.svg`);
    showToast(`Downloaded ${prefix}-${name}.svg`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {name}
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {prefix}
            </span>
            {isHub && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-brand-500 to-indigo-600 text-white">
                <Sparkles className="w-3 h-3" />
                Hub
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleFavorite(iconId);
                showToast(
                  isFavorite ? `Removed ${iconId} from favorites` : `Added ${iconId} to favorites`
                );
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-xl transition-colors ${
                isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:text-amber-500 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Preview & Live Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Left: SVG Canvas */}
            <div
              className={`relative flex items-center justify-center h-52 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors overflow-hidden ${
                bgChoice === 'checker'
                  ? 'bg-checkerboard bg-slate-50 dark:bg-slate-950'
                  : bgChoice === 'white'
                  ? 'bg-white'
                  : bgChoice === 'dark'
                  ? 'bg-slate-950'
                  : 'bg-transparent'
              }`}
            >
              {previewSvg ? (
                <div
                  className="transition-transform duration-150"
                  style={{
                    color: transform.color === 'currentColor' ? undefined : transform.color,
                  }}
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              )}

              {/* Background preview picker bottom-right */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg border border-slate-200 dark:border-slate-800 backdrop-blur-xs text-[10px] font-medium">
                <button
                  onClick={() => setBgChoice('checker')}
                  className={`px-1.5 py-0.5 rounded ${bgChoice === 'checker' ? 'bg-brand-500 text-white font-bold' : 'text-slate-500'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setBgChoice('white')}
                  className={`px-1.5 py-0.5 rounded ${bgChoice === 'white' ? 'bg-brand-500 text-white font-bold' : 'text-slate-500'}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setBgChoice('dark')}
                  className={`px-1.5 py-0.5 rounded ${bgChoice === 'dark' ? 'bg-brand-500 text-white font-bold' : 'text-slate-500'}`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Right: Interactive Transform & Color Controls */}
            <div className="space-y-4 text-xs">
              {/* Size Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Size: {transform.size}px
                  </span>
                  <div className="flex gap-1">
                    {[16, 24, 32, 48, 64].map((s) => (
                      <button
                        key={s}
                        onClick={() => setTransform((prev) => ({ ...prev, size: s }))}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          transform.size === s
                            ? 'bg-brand-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="4"
                  value={transform.size}
                  onChange={(e) =>
                    setTransform((prev) => ({ ...prev, size: Number(e.target.value) }))
                  }
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              {/* Color Presets & Hex Picker */}
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Icon Color
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setTransform((prev) => ({ ...prev, color: p.value }))}
                      title={p.label}
                      className={`h-6 px-2 rounded-md border flex items-center gap-1 transition-all ${
                        transform.color === p.value
                          ? 'border-brand-500 ring-2 ring-brand-500/30 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600"
                        style={{
                          backgroundColor:
                            p.value === 'currentColor' ? 'transparent' : p.value,
                        }}
                      />
                      <span>{p.label}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={
                      transform.color === 'currentColor' ? '#000000' : transform.color
                    }
                    onChange={(e) =>
                      setTransform((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-7 h-6 p-0 border border-slate-200 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                    title="Custom Hex Color"
                  />
                </div>
              </div>

              {/* Transformations (Rotate, Flip H, Flip V) */}
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Transformations
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotate}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      transform.rotate !== 0
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{transform.rotate}°</span>
                  </button>

                  <button
                    onClick={handleFlipH}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      transform.hFlip
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>

                  <button
                    onClick={handleFlipV}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      transform.vFlip
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Snippet Code Tabs & Copy */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {SNIPPET_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download SVG</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre-wrap break-all">{currentSnippet}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
