/**
 * Slugifie une chaîne de caractères.
 * @param s Chaîne à slugifier
 * @returns Chaîne slugifiée
 */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')        
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
