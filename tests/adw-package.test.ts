import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { validateIconSet, getIconData } from '@iconify/utils';

describe('Adwaita Package (@iconify-hub/adw)', () => {
  const pkgDir = path.resolve(process.cwd(), 'packages/adw');

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

    assert.equal(validated.prefix, 'adw');
    assert.ok(Object.keys(validated.icons).length > 500, 'has over 500 icons');
  });

  test('retrieves sample icons and aliases using @iconify/utils', async () => {
    const raw = await fs.readFile(path.join(pkgDir, 'icons.json'), 'utf8');
    const data = JSON.parse(raw);

    // Test normalized base icon
    const copyIcon = getIconData(data, 'edit-copy');
    assert.ok(copyIcon, 'edit-copy icon found');
    assert.ok(copyIcon.body.length > 0, 'edit-copy has svg body');

    // Test original symbolic alias
    const copyAlias = getIconData(data, 'edit-copy-symbolic');
    assert.ok(copyAlias, 'edit-copy-symbolic alias resolves');
    assert.equal(copyAlias.body, copyIcon.body, 'alias matches parent body');

    // Test other common icons
    const folderIcon = getIconData(data, 'folder');
    assert.ok(folderIcon, 'folder icon found');

    const emblemIcon = getIconData(data, 'emblem-important');
    assert.ok(emblemIcon, 'emblem-important icon found');
  });

  test('svg directory contains standalone SVGs', async () => {
    const svgDir = path.join(pkgDir, 'svg');
    const svgs = await fs.readdir(svgDir);
    assert.ok(svgs.length > 500, 'contains over 500 SVG files');
    assert.ok(svgs.includes('edit-copy.svg'));
  });
});
