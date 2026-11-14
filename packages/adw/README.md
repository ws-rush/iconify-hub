# GNOME Adwaita (@iconify-hub/adw)

Unofficial Iconify dataset for **GNOME Adwaita**.

- **Icon Prefix:** `adw`
- **Total Icons:** 643
- **Version:** 49.0.0
- **License:** [CC-BY-SA-4.0](https://gitlab.gnome.org/GNOME/adwaita-icon-theme/-/blob/master/COPYING)
- **Author:** [GNOME Project](https://gitlab.gnome.org/GNOME/adwaita-icon-theme)

## Installation

```bash
npm install @iconify-hub/adw
# or
pnpm add @iconify-hub/adw
# or
yarn add @iconify-hub/adw
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
        adw: () => import('@iconify-hub/adw/icons.json').then(i => i.default),
      },
    }),
  ],
})
```

Then use in your templates:
```html
<span class="i-adw:document-edit"></span>
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
        'adw': () => import('@iconify-hub/adw/icons.json').then(m => m.default),
      },
    }),
  ],
}
```

### 3. With Iconify React / Vue / Svelte

```tsx
import { Icon } from '@iconify/react'
import icons from '@iconify-hub/adw/icons.json'
import { addCollection } from '@iconify/react'

addCollection(icons)

export function App() {
  return <Icon icon="adw:edit-copy" />
}
```

### 4. Direct SVG Access

Optimized SVG files are provided directly in `svg/`:
```
@iconify-hub/adw/svg/edit-copy.svg
```

## Categories

- **Actions** (182 icons)
- **Categories** (20 icons)
- **Devices** (65 icons)
- **Emotes** (26 icons)
- **Legacy** (51 icons)
- **Mimetypes** (20 icons)
- **Places** (18 icons)
- **Status** (237 icons)
- **Ui** (25 icons)
