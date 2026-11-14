import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderSvgString,
  generateSnippet,
  getDefaultTransformOptions,
} from '../src/services/renderService.js';
import type { IconData } from '../src/types/icon.js';

describe('Render Service & Code Generator', () => {
  const sampleIcon: IconData = {
    body: '<path fill="currentColor" d="M0 0h16v16H0z"/>',
    width: 16,
    height: 16,
  };

  it('renders clean SVG string with default options', () => {
    const svg = renderSvgString(sampleIcon);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('width="48"'));
    assert.ok(svg.includes('height="48"'));
    assert.ok(svg.includes('viewBox="0 0 16 16"'));
    assert.ok(svg.includes('<path'));
    assert.ok(svg.endsWith('</svg>'));
  });

  it('applies custom dimensions and colors', () => {
    const svg = renderSvgString(sampleIcon, {
      size: 32,
      color: '#0284c7',
    });
    assert.ok(svg.includes('width="32"'));
    assert.ok(svg.includes('height="32"'));
    assert.ok(svg.includes('#0284c7'));
    assert.ok(!svg.includes('currentColor'));
  });

  it('generates React snippet', () => {
    const snippet = generateSnippet('react', 'adw', 'edit-copy', sampleIcon, {
      size: 24,
      rotate: 90,
      hFlip: true,
    });
    assert.equal(
      snippet,
      '<Icon icon="adw:edit-copy" width="24" height="24" rotate={90} hFlip={true} />'
    );
  });

  it('generates Vue snippet', () => {
    const snippet = generateSnippet('vue', 'breeze', 'folder', sampleIcon, {
      size: 32,
    });
    assert.equal(snippet, '<Icon icon="breeze:folder" width="32" height="32" />');
  });

  it('generates Svelte snippet', () => {
    const snippet = generateSnippet('svelte', 'adw', 'ac-adapter', sampleIcon, {
      size: 16,
    });
    assert.equal(snippet, '<Icon icon="adw:ac-adapter" width="16" height="16" />');
  });

  it('generates UnoCSS class snippet', () => {
    const snippet = generateSnippet('unocss', 'adw', 'edit-copy', sampleIcon, {
      size: 24,
      rotate: 90,
      hFlip: true,
    });
    assert.ok(snippet.includes('i-adw:edit-copy'));
    assert.ok(snippet.includes('w-[24px]'));
    assert.ok(snippet.includes('h-[24px]'));
    assert.ok(snippet.includes('-scale-x-100'));
    assert.ok(snippet.includes('rotate-90'));
  });

  it('generates clean HTML raw SVG snippet', () => {
    const snippet = generateSnippet('svg', 'adw', 'edit-copy', sampleIcon, {
      size: 40,
    });
    assert.ok(snippet.startsWith('<svg'));
    assert.ok(snippet.includes('width="40"'));
    assert.ok(snippet.includes('height="40"'));
  });

  it('generates CSS mask rule snippet', () => {
    const snippet = generateSnippet('css', 'adw', 'edit-copy', sampleIcon, {
      size: 24,
    });
    assert.ok(snippet.includes('.icon'));
    assert.ok(snippet.includes('mask-image'));
    assert.ok(snippet.includes('width: 24px;'));
    assert.ok(snippet.includes('height: 24px;'));
  });
});
