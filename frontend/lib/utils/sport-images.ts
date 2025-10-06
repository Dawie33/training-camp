// Mapping des images par sport (URLs Unsplash fixes)
const SPORT_IMAGES: Record<string, string[]> = {
  crossfit: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  ],
  running: [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80',
  ],
  cycling: [
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  weightlifting: [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
  ],
  // Image par défaut pour les sports non listés
  default: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  ],
}

/**
 * Récupère une image pour un sport donné
 * @param sportSlug Le slug du sport (ex: "crossfit", "running")
 * @param seed Un identifiant unique (ex: workout ID) pour avoir toujours la même image
 * @returns L'URL de l'image
 */
export function getSportImage(sportSlug: string, seed: string): string {
  const images = SPORT_IMAGES[sportSlug] || SPORT_IMAGES.default

  // Utiliser le seed pour choisir une image de manière déterministe
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % images.length

  return images[index]
}
