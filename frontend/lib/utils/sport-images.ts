// Mapping des images par sport (URLs Unsplash fixes - une image unique par sport)
const SPORT_IMAGES: Record<string, string> = {
  // CrossFit
  crossfit: 'https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',

  // Cross-Training (entraînement croisé)
  'cross-training': 'https://images.unsplash.com/photo-1606903037631-f09fd0bd74b4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',

  // Musculation
  musculation: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',

  // Weightlifting (haltérophilie)
  weightlifting: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',

  // Running
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',

  // Course (piste/athlétisme)
  course: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',

  // Cycling
  cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',

  // Image par défaut pour les sports non listés
  default: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
}

/**
 * Récupère l'image pour un sport donné
 * @param sportSlug Le slug du sport (ex: "crossfit", "running")
 * @returns L'URL de l'image Unsplash
 */
export function getSportImage(sportSlug: string): string {
  return SPORT_IMAGES[sportSlug] || SPORT_IMAGES.default
}
