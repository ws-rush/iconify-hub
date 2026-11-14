import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildIconSet } from '../src/builder.js';
import type { IconSetDefinition } from '../src/types.js';

describe('Builder & Color Processing', () => {
  test('processes monochrome SVG to currentColor and creates symbolic alias', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'iconify-hub-test-'));
    const actionsDir = path.join(tmpDir, 'actions');
    await fs.mkdir(actionsDir, { recursive: true });

    // Sample Adwaita-style SVG with #2e3436 fill and -symbolic naming
    const sampleSvg = `<svg height="16px" viewBox="0 0 16 16" width="16px" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h16v16H0z" fill="#2e3436"/>
    </svg>`;
    await fs.writeFile(path.join(actionsDir, 'test-icon-symbolic.svg'), sampleSvg);

    const def: IconSetDefinition = {
      id: 'test-set',
      prefix: 'test',
      source: { type: 'local', path: tmpDir },
      info: {
        name: 'Test Set',
        version: '1.0.0',
      },
      package: {
        name: '@iconify-hub/test',
        version: '1.0.0',
      },
    };

    const { iconSet, categories } = await buildIconSet(def, tmpDir);

    assert.equal(iconSet.count(), 1);
    assert.ok(iconSet.exists('test-icon'));
    assert.ok(iconSet.exists('test-icon-symbolic'));

    const exported = iconSet.export();
    const iconData = exported.icons['test-icon'];
    assert.ok(iconData);
    assert.ok(iconData.body.includes('fill="currentColor"'));
    assert.ok(!iconData.body.includes('#2e3436'));

    // Verify alias
    assert.deepEqual(exported.aliases?.['test-icon-symbolic'], { parent: 'test-icon' });

    // Verify category
    assert.ok(categories['Actions']?.includes('test-icon'));

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('preserves accent colors like red warning and green success', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'iconify-hub-accent-test-'));
    const statusDir = path.join(tmpDir, 'status');
    await fs.mkdir(statusDir, { recursive: true });

    const accentSvg = `<svg height="16px" viewBox="0 0 16 16" width="16px" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h8v16H0z" fill="#2e3436"/>
      <path d="M8 0h8v16H8z" fill="#ed333b"/>
    </svg>`;
    await fs.writeFile(path.join(statusDir, 'battery-error-symbolic.svg'), accentSvg);

    const def: IconSetDefinition = {
      id: 'accent-set',
      prefix: 'accent',
      source: { type: 'local', path: tmpDir },
      info: { name: 'Accent', version: '1.0.0' },
      package: { name: '@iconify-hub/accent', version: '1.0.0' },
    };

    const { iconSet } = await buildIconSet(def, tmpDir);
    const exported = iconSet.export();
    const body = exported.icons['battery-error'].body;

    assert.ok(body.includes('fill="currentColor"'));
    assert.ok(body.includes('#ed333b') || body.includes('#ED333B'));

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
