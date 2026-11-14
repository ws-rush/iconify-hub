import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { validateIconSet, getIconData } from '@iconify/utils';

describe('Breeze Package (@iconify-hub/breeze)', () => {
  const pkgDir = path.resolve(process.cwd(), 'packages/breeze');

  test('package contains all required Iconify JSON package files', () => {
    assert.ok(existsSync(path.join(pkgDir, 'package.json')), 'package.json exists');
    assert.ok(existsSync(path.join(pkgDir, 'icons.json')), 'icons.json exists');
    assert.ok(existsSync(path.join(pkgDir, 'info.json')), 'info.json exists');
    assert.ok(existsSync(path.join(pkgDir, 'index.mjs')), 'index.mjs exists');
    assert.ok(existsSync(path.join(pkgDir, 'index.js')), 'index.js exists');
    assert.ok(existsSync(path.join(pkgDir, 'index.d.ts')), 'index.d.ts exists');
    assert.ok(existsSync(path.join(pkgDir, 'README.md')), 'README.md exists');
    assert.ok(existsSync(path.join(pkgDir, 'svg')), 'svg directory exists');
  });

  test('icons.json conforms to Iconify schema', async () => {
    const raw = await fs.readFile(path.join(pkgDir, 'icons.json'), 'utf8');
    const data = JSON.parse(raw);
    const validated = validateIconSet(data);

    assert.equal(validated.prefix, 'breeze');
    assert.ok(Object.keys(validated.icons).length > 2000, 'has over 2000 icons');
  });

  test('retrieves sample icons and aliases using @iconify/utils', async () => {
    const raw = await fs.readFile(path.join(pkgDir, 'icons.json'), 'utf8');
    const data = JSON.parse(raw);

    // Test normalized base icon
    const openIcon = getIconData(data, 'document-open');
    assert.ok(openIcon, 'document-open icon found');
    assert.ok(openIcon.body.length > 0, 'document-open has svg body');

    // Test symbolic alias
    const openAlias = getIconData(data, 'document-open-symbolic');
    assert.ok(openAlias, 'document-open-symbolic alias resolves');
    assert.equal(openAlias.body, openIcon.body, 'alias matches parent body');

    // Test other common icons
    const copyIcon = getIconData(data, 'edit-copy');
    assert.ok(copyIcon, 'edit-copy icon found');

    const folderIcon = getIconData(data, 'folder');
    assert.ok(folderIcon, 'folder icon found');
  });

  test('svg directory contains standalone SVGs', async () => {
    const svgDir = path.join(pkgDir, 'svg');
    const svgs = await fs.readdir(svgDir);
    assert.ok(svgs.length > 2000, 'contains over 2000 SVG files');
    assert.ok(svgs.includes('document-open.svg'));
  });
});
