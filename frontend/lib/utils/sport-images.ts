// Mapping des images par sport (URLs Unsplash fixes)
const SPORT_IMAGES: Record<string, string[]> = {
  'cross-training': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80',
  ],
  crossfit: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  ],
  musculation: [
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
  ],
  weightlifting: [
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
  ],
  running: [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
    'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800&q=80',
  ],
  course: [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
    'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800&q=80',
  ],
  cycling: [
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
    'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&q=80',
  ],


  // Image par défaut pour les sports non listés
  default: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
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
