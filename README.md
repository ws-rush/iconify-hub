# Iconify Hub

A monorepo and automated pipeline for building, maintaining, and publishing unofficial icon sets compatible with the [Iconify](https://iconify.design/) ecosystem.

All packages produced by this hub conform 100% to Iconify JSON standards and can be consumed by tools such as:
- [UnoCSS](https://unocss.dev/presets/icons) (`@unocss/preset-icons`)
- [unplugin-icons](https://github.com/unplugin/unplugin-icons)
- [Tailwind CSS Iconify Plugin](https://github.com/iconify/iconify/tree/main/plugins/tailwind)
- `@iconify/react`, `@iconify/vue`, `@iconify/svelte`, and Web Components
- Any tooling consuming Iconify JSON datasets

---

## Available Sets

| ID | Prefix | Name | Version | Icons | Upstream Source | Package |
|---|---|---|---|---|---|---|
| `adw` | `adw` | **GNOME Adwaita** | `49.0.0` | 641 | [adwaita-icon-theme](https://gitlab.gnome.org/GNOME/adwaita-icon-theme) | [`packages/adw`](./packages/adw) |
| `breeze` | `breeze` | **KDE Breeze** | `6.32.0` | 3,422 | [breeze-icons](https://github.com/KDE/breeze-icons) | [`packages/breeze`](./packages/breeze) |

---

## Installation via GitHub

Because these icon sets are maintained directly on GitHub without publishing to npm, you can install them using Git subpaths or local directory references.

### 1. Using Package Managers (Git Subpath)

```bash
# GNOME Adwaita
pnpm add "github:ws-rush/iconify-hub#path:packages/adw"

# KDE Breeze
pnpm add "github:ws-rush/iconify-hub#path:packages/breeze"
```

You can also specify the dependency directly in your project's `package.json`:

```json
{
  "dependencies": {
    "@iconify-hub/adw": "github:ws-rush/iconify-hub#path:packages/adw",
    "@iconify-hub/breeze": "github:ws-rush/iconify-hub#path:packages/breeze"
  }
}
```

### 2. Local Monorepo or Submodule Reference

If you clone or add `iconify-hub` as a git submodule:

```bash
pnpm add ./packages/adw
```

---

## Quick Start: Using GNOME Adwaita (`adw`)

### 1. UnoCSS (`uno.config.ts`)

```ts
import { defineConfig, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      collections: {
        adw: () => import('@iconify-hub/adw/icons.json').then((m) => m.default),
      },
    }),
  ],
})
```

Use in markup:
```html
<span class="i-adw:document-edit"></span>
<span class="i-adw:edit-copy"></span>
<span class="i-adw:battery-level-100"></span>
```

### 3. unplugin-icons (`vite.config.ts`)

```ts
import Icons from 'unplugin-icons/vite'

export default {
  plugins: [
    Icons({
      customCollections: {
        adw: () => import('@iconify-hub/adw/icons.json').then((m) => m.default),
      },
    }),
  ],
}
```

### 4. React / Vue / Svelte

```tsx
import { Icon, addCollection } from '@iconify/react'
import adwIcons from '@iconify-hub/adw/icons.json'

addCollection(adwIcons)

export function App() {
  return (
    <div>
      <Icon icon="adw:edit-copy" className="text-xl text-blue-500" />
      <Icon icon="adw:folder" className="text-xl text-amber-500" />
    </div>
  )
}
```

---

## Architecture & Maintenance System

Iconify Hub provides an automated engine that handles the full lifecycle of an icon set:

```
[Upstream Git / Local / Tarball]
               │
               ▼
   [SourceManager (.cache/sources)]
               │
               ▼
   [SVG Processing Engine]
      • SVG Cleanup & Validation
      • Bad Tag / Attribute Stripping
      • Color Handling (Monochrome -> currentColor, Preserves Accents)
      • SVGO Optimization
      • Category Classification
      • Alias Mapping (e.g. `edit-copy` <=> `edit-copy-symbolic`)
               │
               ▼
   [@iconify/tools Packager]
      • icons.json
      • info.json
      • metadata.json
      • index.js (CJS) & index.mjs (ESM)
      • index.d.ts (Types)
      • package.json (with standard Iconify exports)
      • Standalone optimized SVGs (svg/)
      • README.md
               │
               ▼
   [@iconify/utils Schema Validation]
```

---

## Adding a New Icon Set

To add a new icon set:

1. **Scaffold a new set configuration:**
   ```bash
   pnpm iconify-hub new <set-id>
   ```

2. **Define the upstream source and metadata in `src/sets/<set-id>.ts`:**
   ```ts
   import type { IconSetDefinition } from '../types.js'

   export const mySet: IconSetDefinition = {
     id: 'myset',
     prefix: 'myset',
     source: {
       type: 'git',
       url: 'https://github.com/org/repo.git',
       ref: 'v1.0.0',
       subDir: 'icons',
     },
     info: {
       name: 'My Icon Set',
       version: '1.0.0',
       author: { name: 'Author', url: 'https://example.com' },
       license: { title: 'MIT', spdx: 'MIT' },
       category: 'General',
     },
     package: {
       name: '@iconify-hub/myset',
       version: '1.0.0',
     },
   }
   ```

3. **Register it in `src/sets/index.ts`:**
   ```ts
   import { mySet } from './myset.js'

   export const registeredSets = {
     adw: adwSet,
     myset: mySet,
   }
   ```

4. **Build and validate:**
   ```bash
   pnpm build:myset # or pnpm build
   pnpm validate
   ```

---

## CLI Commands

```bash
# Build all registered sets
pnpm build

# Build a specific set
pnpm iconify-hub build adw

# List all registered sets and source info
pnpm list

# Check upstream repositories for newer releases
pnpm check

# Automatically update set definitions and rebuild packages if updates exist
pnpm update

# Validate all built sets against the Iconify JSON schema
pnpm validate

# Run test suite
pnpm test

# Run Web Explorer development server
pnpm dev:web

# Build Web Explorer for production
pnpm build:web
```

---

## Automated Maintenance & CI/CD

This repository includes two GitHub Actions workflows:

1. **Continuous Integration ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)):**
   - Runs on every push and pull request to `main`.
   - Executes typechecking (`pnpm typecheck`), compilation (`pnpm compile`), test suite (`pnpm test`), and Iconify schema validation (`pnpm validate`).

2. **Upstream Check & Release ([`.github/workflows/upstream-check.yml`](./.github/workflows/upstream-check.yml)):**
   - Runs on a cron schedule daily at 04:00 UTC and on manual trigger (`workflow_dispatch`).
   - Checks upstream Git repositories for new tags.
   - If updates are detected, it updates set configs, rebuilds packages, runs full validation, commits changes, creates a Git release tag, and publishes a new GitHub Release.

---

## License

The build system and tooling in this repository are licensed under the MIT License.
Individual icon sets in `packages/` maintain their respective upstream licenses (e.g., GNOME Adwaita is licensed under CC-BY-SA-4.0 / LGPL-3.0).
