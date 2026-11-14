import type { CollectionInfo, IconSetData, IconMetadata, IconData } from '../types/icon';
import adwInfoRaw from '../../../../packages/adw/info.json';
import breezeInfoRaw from '../../../../packages/breeze/info.json';

const adwInfo: CollectionInfo = {
  prefix: 'adw',
  name: adwInfoRaw.name || 'GNOME Adwaita',
  total: adwInfoRaw.total || 641,
  author: adwInfoRaw.author,
  license: adwInfoRaw.license,
  version: adwInfoRaw.version,
  samples: adwInfoRaw.samples,
  height: adwInfoRaw.height,
  displayHeight: adwInfoRaw.displayHeight,
  category: adwInfoRaw.category || 'General',
  isHub: true,
};

const breezeInfo: CollectionInfo = {
  prefix: 'breeze',
  name: breezeInfoRaw.name || 'KDE Breeze',
  total: breezeInfoRaw.total || 3422,
  author: breezeInfoRaw.author,
  license: breezeInfoRaw.license,
  version: breezeInfoRaw.version,
  samples: breezeInfoRaw.samples,
  height: breezeInfoRaw.height,
  displayHeight: breezeInfoRaw.displayHeight,
  category: breezeInfoRaw.category || 'General',
  isHub: true,
};

export const HUB_COLLECTIONS: CollectionInfo[] = [adwInfo, breezeInfo];

export function isHubPrefix(prefix: string): boolean {
  return prefix === 'adw' || prefix === 'breeze';
}

export function getHubCollectionInfo(prefix: string): CollectionInfo | undefined {
  return HUB_COLLECTIONS.find((c) => c.prefix === prefix);
}

// In-memory cache for loaded Hub icon sets
const hubDataCache = new Map<string, { iconSet: IconSetData; metadata: IconMetadata }>();

function normalizeIconSet(rawSet: IconSetData): IconSetData {
  const defaultWidth = rawSet.width || 16;
  const defaultHeight = rawSet.height || 16;
  const defaultLeft = rawSet.left || 0;
  const defaultTop = rawSet.top || 0;

  const normalizedIcons: Record<string, IconData> = {};

  for (const [name, icon] of Object.entries(rawSet.icons)) {
    normalizedIcons[name] = {
      ...icon,
      width: icon.width ?? defaultWidth,
      height: icon.height ?? defaultHeight,
      left: icon.left ?? defaultLeft,
      top: icon.top ?? defaultTop,
    };
  }

  if (rawSet.aliases) {
    for (const [aliasName, aliasInfo] of Object.entries(rawSet.aliases)) {
      const parent = normalizedIcons[aliasInfo.parent];
      if (parent) {
        normalizedIcons[aliasName] = {
          ...parent,
          rotate: aliasInfo.rotate ?? parent.rotate,
          hFlip: aliasInfo.hFlip ?? parent.hFlip,
          vFlip: aliasInfo.vFlip ?? parent.vFlip,
        };
      }
    }
  }

  return {
    ...rawSet,
    icons: normalizedIcons,
  };
}

export async function getHubIconSet(prefix: string): Promise<{ iconSet: IconSetData; metadata: IconMetadata } | null> {
  const cached = hubDataCache.get(prefix);
  if (cached) {
    return cached;
  }

  if (prefix === 'adw') {
    const [iconsModule, metaModule] = await Promise.all([
      import('../../../../packages/adw/icons.json'),
      import('../../../../packages/adw/metadata.json'),
    ]);

    const rawSet = (iconsModule.default || iconsModule) as unknown as IconSetData;
    const data = {
      iconSet: normalizeIconSet(rawSet),
      metadata: (metaModule.default || metaModule) as unknown as IconMetadata,
    };
    hubDataCache.set('adw', data);
    return data;
  }

  if (prefix === 'breeze') {
    const [iconsModule, metaModule] = await Promise.all([
      import('../../../../packages/breeze/icons.json'),
      import('../../../../packages/breeze/metadata.json'),
    ]);

    const rawSet = (iconsModule.default || iconsModule) as unknown as IconSetData;
    const data = {
      iconSet: normalizeIconSet(rawSet),
      metadata: (metaModule.default || metaModule) as unknown as IconMetadata,
    };
    hubDataCache.set('breeze', data);
    return data;
  }

  return null;
}
