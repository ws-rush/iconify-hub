import type { IconSetDefinition } from '../types.js';
import { adwSet } from './adw.js';

export const registeredSets: Record<string, IconSetDefinition> = {
  adw: adwSet,
};

export function getSet(id: string): IconSetDefinition | undefined {
  return registeredSets[id];
}

export function getAllSets(): IconSetDefinition[] {
  return Object.values(registeredSets);
}
