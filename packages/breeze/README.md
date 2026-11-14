# KDE Breeze (@iconify-hub/breeze)

Unofficial Iconify dataset for **KDE Breeze**.

- **Icon Prefix:** `breeze`
- **Total Icons:** 3422
- **Version:** 6.32.0
- **License:** [LGPL-3.0](https://invent.kde.org/frameworks/breeze-icons/-/blob/master/COPYING.LIB)
- **Author:** [KDE Visual Design Group](https://invent.kde.org/frameworks/breeze-icons)

## Installation via GitHub

Install directly from GitHub without publishing to npm:

### 1. Using package managers (Git subpath)

```bash
# npm
npm install "github:ws-rush/iconify-hub#path:packages/breeze"

# pnpm
pnpm add "github:ws-rush/iconify-hub#path:packages/breeze"

# yarn
yarn add "https://github.com/ws-rush/iconify-hub.git#path:packages/breeze"

# bun
bun add "github:ws-rush/iconify-hub#path:packages/breeze"
```

Or add directly to `package.json`:
```json
{
  "dependencies": {
    "@iconify-hub/breeze": "github:ws-rush/iconify-hub#path:packages/breeze"
  }
}
```

### 2. Local or Monorepo Reference

```bash
pnpm add ./packages/breeze
```

## Usage

### 1. With UnoCSS (`@unocss/preset-icons`)

```ts
// uno.config.ts
import { defineConfig, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      collections: {
        breeze: () => import('@iconify-hub/breeze/icons.json').then(i => i.default),
      },
    }),
  ],
})
```

Then use in your templates:
```html
<span class="i-breeze:document-edit"></span>
```

### 2. With `unplugin-icons`

```ts
// vite.config.ts
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default {
  plugins: [
    Icons({
      customCollections: {
        'breeze': () => import('@iconify-hub/breeze/icons.json').then(m => m.default),
      },
    }),
  ],
}
```

### 3. With Iconify React / Vue / Svelte

```tsx
import { Icon } from '@iconify/react'
import icons from '@iconify-hub/breeze/icons.json'
import { addCollection } from '@iconify/react'

addCollection(icons)

export function App() {
  return <Icon icon="breeze:edit-copy" />
}
```

### 4. Direct SVG Access

Optimized SVG files are provided directly in `svg/`:
```
@iconify-hub/breeze/svg/edit-copy.svg
```

## Categories

- **Actions** (1959 icons)
- **Animations** (1 icons)
- **Applets** (13 icons)
- **Apps** (45 icons)
- **Categories** (18 icons)
- **Devices** (79 icons)
- **Emblems** (33 icons)
- **Emotes** (34 icons)
- **Mimetypes** (514 icons)
- **Places** (113 icons)
- **Preferences** (96 icons)
- **Status** (539 icons)
