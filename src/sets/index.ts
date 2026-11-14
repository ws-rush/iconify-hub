import type { IconSetDefinition } from '../types.js';
import { adwSet } from './adw.js';
import { breezeSet } from './breeze.js';

export const registeredSets: Record<string, IconSetDefinition> = {
  adw: adwSet,
  breeze: breezeSet,
};

export function getSet(id: string): IconSetDefinition | undefined {
  return registeredSets[id];
}

export function getAllSets(): IconSetDefinition[] {
  return Object.values(registeredSets);
}
