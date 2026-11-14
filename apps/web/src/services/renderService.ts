import { getIconCSS, iconToHTML, iconToSVG } from '@iconify/utils';
import type { IconData, IconTransformOptions, SnippetLanguage } from '../types/icon';

export function getDefaultTransformOptions(): IconTransformOptions {
  return {
    size: 48,
    color: 'currentColor',
    backgroundColor: 'transparent',
    rotate: 0,
    hFlip: false,
    vFlip: false,
  };
}

export function renderSvgString(iconData: IconData, options: Partial<IconTransformOptions> = {}): string {
  const mergedOptions = { ...getDefaultTransformOptions(), ...options };

  const renderData = iconToSVG(iconData as any, {
    width: mergedOptions.size,
    height: mergedOptions.size,
    rotate: mergedOptions.rotate,
    hFlip: mergedOptions.hFlip,
    vFlip: mergedOptions.vFlip,
  });

  const attributes: Record<string, string> = {};
  if (renderData.attributes.width) attributes.width = renderData.attributes.width;
  if (renderData.attributes.height) attributes.height = renderData.attributes.height;
  if (renderData.attributes.viewBox) attributes.viewBox = renderData.attributes.viewBox;

  // If color is not currentColor and not empty, inject inline style
  if (mergedOptions.color && mergedOptions.color !== 'currentColor') {
    attributes.style = `color: ${mergedOptions.color};`;
  }

  let html = iconToHTML(renderData.body, attributes);

  // If user selected a custom color other than currentColor, also replace currentColor in path fills/strokes
  if (mergedOptions.color && mergedOptions.color !== 'currentColor') {
    html = html.replace(/currentColor/g, mergedOptions.color);
  }

  return html;
}

export function generateSnippet(
  language: SnippetLanguage,
  prefix: string,
  name: string,
  iconData?: IconData,
  options: Partial<IconTransformOptions> = {}
): string {
  const opts = { ...getDefaultTransformOptions(), ...options };
  const iconId = `${prefix}:${name}`;

  const transformProps: string[] = [];
  if (opts.rotate) transformProps.push(`rotate={${opts.rotate}}`);
  if (opts.hFlip) transformProps.push(`hFlip={true}`);
  if (opts.vFlip) transformProps.push(`vFlip={true}`);
  if (opts.color && opts.color !== 'currentColor') transformProps.push(`color="${opts.color}"`);

  const propsStr = transformProps.length > 0 ? ' ' + transformProps.join(' ') : '';

  switch (language) {
    case 'react':
      return `<Icon icon="${iconId}" width="${opts.size}" height="${opts.size}"${propsStr} />`;

    case 'vue':
      return `<Icon icon="${iconId}" width="${opts.size}" height="${opts.size}"${propsStr} />`;

    case 'svelte':
      return `<Icon icon="${iconId}" width="${opts.size}" height="${opts.size}"${propsStr} />`;

    case 'unocss': {
      const transforms: string[] = [];
      if (opts.hFlip) transforms.push('-scale-x-100');
      if (opts.vFlip) transforms.push('-scale-y-100');
      if (opts.rotate === 90) transforms.push('rotate-90');
      if (opts.rotate === 180) transforms.push('rotate-180');
      if (opts.rotate === 270) transforms.push('rotate-270');
      const cls = [`i-${prefix}:${name}`, `w-[${opts.size}px]`, `h-[${opts.size}px]`, ...transforms].join(' ');
      return `<span class="${cls}"></span>`;
    }

    case 'svg': {
      if (!iconData) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}"><!-- ${iconId} --></svg>`;
      }
      return renderSvgString(iconData, opts);
    }

    case 'css': {
      if (!iconData) {
        return `/* ${iconId} */\n.icon {\n  display: inline-block;\n  width: ${opts.size}px;\n  height: ${opts.size}px;\n}`;
      }
      try {
        const css = getIconCSS(iconData as any);
        return css.replace(/width: 1em;/, `width: ${opts.size}px;`).replace(/height: 1em;/, `height: ${opts.size}px;`);
      } catch {
        const svg = renderSvgString(iconData, opts);
        const encoded = encodeURIComponent(svg);
        return `.icon {\n  display: inline-block;\n  width: ${opts.size}px;\n  height: ${opts.size}px;\n  background: url("data:image/svg+xml,${encoded}") no-repeat center / contain;\n}`;
      }
    }
  }
}

export function downloadSvgFile(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
