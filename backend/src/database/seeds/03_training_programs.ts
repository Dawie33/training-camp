import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  const crossfitSport = await knex('sports').where({ slug: 'crossfit' }).first();
  await knex('training_programs').del();
  await knex('training_programs').insert([
    {
      name: 'CrossFit - Débutant',
      slug: 'crossfit-debutant',
      description: 'Programme CrossFit pour débutants sur 4 semaines.',
      objectives: 'Découverte des mouvements et amélioration de la condition physique.',
      sport_id: crossfitSport.id,
      target_level: 'beginner',
      duration_weeks: 4,
      sessions_per_week: 3,
      estimated_session_duration: 60,
      program_type: 'strength_building',
      intensity_profile: 'moderate',
      volume_profile: 'progressive',
      prerequisites: JSON.stringify(['aucun']),
      equipment_required: JSON.stringify(['barbell', 'pull-up bar']),
      weekly_structure: JSON.stringify({ week1: ['WOD1', 'WOD2', 'WOD3'] }),
      program_status: 'active',
      is_premium: false,
      is_featured: true
    },
    {
      name: 'Running - 5K',
      slug: 'running-5k',
      description: 'Programme pour préparer une course de 5 kilomètres.',
      objectives: 'Améliorer l’endurance et la vitesse.',
      sport_id: crossfitSport.id,
      target_level: 'beginner',
      duration_weeks: 6,
      sessions_per_week: 4,
      estimated_session_duration: 45,
      program_type: 'endurance_base',
      intensity_profile: 'variable',
      volume_profile: 'progressive',
      prerequisites: JSON.stringify(['aucun']),
      equipment_required: JSON.stringify(['shoes']),
      weekly_structure: JSON.stringify({ week1: ['Run 2km', 'Run 3km', 'Rest', 'Run 2km'] }),
      program_status: 'active',
      is_premium: false,
      is_featured: false
    }
  ]);
}