 // Seed minimal (optionnel)
import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex('equipments').del();
  await knex('equipments').insert([
    { slug: 'barbell', label: 'Barre olympique', meta: {} },
    { slug: 'bumper_plates', label: 'Disques bumper', meta: {} },
    { slug: 'dumbbell', label: 'Haltères', meta: {} },
    { slug: 'kettlebell', label: 'Kettlebell', meta: {} },
    { slug: 'rings', label: 'Anneaux', meta: {} },
    { slug: 'pullup_bar', label: 'Barre de traction', meta: {} },
    { slug: 'rower', label: 'Rameur', meta: {} },
    { slug: 'airbike', label: 'AirBike', meta: {} },
    { slug: 'bike_erg', label: 'BikeErg', meta: {} },
    { slug: 'ski_erg', label: 'SkiErg', meta: {} },
    { slug: 'jump_rope', label: 'Corde à sauter', meta: {} },
  ])

}