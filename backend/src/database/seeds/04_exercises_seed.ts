import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex('exercises').del();
  await knex('exercises').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Air Squat',
      slug: 'air-squat',
      description: 'Squat au poids du corps.',
      instructions: 'Pieds largeur des épaules, descendre en gardant le dos droit.',
      category: 'strength',
      muscle_groups: JSON.stringify(['legs', 'core']),
      difficulty: 'beginner',
      scaling_options: JSON.stringify(['box squat']),
      equipment_required: JSON.stringify([]),
      bodyweight_only: true,
      measurement_type: 'reps',
      contraindications: JSON.stringify(['douleur genou']),
      safety_notes: 'Ne pas arrondir le dos.',
      video_url: null,
      image_url: null,
      isActive: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Pull-Up',
      slug: 'pull-up',
      description: 'Traction à la barre fixe.',
      instructions: 'Saisir la barre, tirer le menton au-dessus de la barre.',
      category: 'gymnastics',
      muscle_groups: JSON.stringify(['back', 'arms']),
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['banded pull-up', 'jumping pull-up']),
      equipment_required: JSON.stringify(['pull-up bar']),
      bodyweight_only: true,
      measurement_type: 'reps',
      contraindications: JSON.stringify(['épaule instable']),
      safety_notes: 'Contrôler la descente.',
      video_url: null,
      image_url: null,
      isActive: true
    }
  ]);
}