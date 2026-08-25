import type { Knex } from 'knex'

const definitions = [
    ['Down Up', 'down-up', 'strength', 'beginner', [], true, 'reps'],
    ['Hand Release Push-Up', 'hand-release-push-up', 'strength', 'beginner', [], true, 'reps'],
    ['Lunges', 'lunges', 'strength', 'beginner', [], true, 'reps'],
    ['V-Up', 'v-up', 'strength', 'intermediate', [], true, 'reps'],
    ['Toes-to-Bar', 'toes-to-bar', 'gymnastics', 'intermediate', ['pull-up-bar'], true, 'reps'],
    ['Hollow Hold', 'hollow-hold', 'strength', 'beginner', [], true, 'time'],
    ['Pistol Squat', 'pistol-squat', 'gymnastics', 'advanced', [], true, 'reps'],
    ['Step-Up', 'step-up', 'strength', 'beginner', ['box'], true, 'reps'],
    ['Tuck-Up', 'tuck-up', 'strength', 'intermediate', [], true, 'reps'],
    ['Inchworm', 'inchworm', 'gymnastics', 'beginner', [], true, 'reps'],
    ['Broad Jump', 'broad-jump', 'cardio', 'intermediate', [], true, 'reps'],
    ['Superman Hold', 'superman-hold', 'strength', 'beginner', [], true, 'time'],
    ['Burpee Pull-Up', 'burpee-pull-up', 'gymnastics', 'intermediate', ['pull-up-bar'], true, 'reps'],
    ['Glute Bridge', 'glute-bridge', 'strength', 'beginner', [], true, 'reps'],
    ['Russian Twist', 'russian-twist', 'strength', 'beginner', [], true, 'reps'],
    ['Bear Crawl', 'bear-crawl', 'cardio', 'beginner', [], true, 'distance'],
    ['Box Step-Over', 'box-step-over', 'strength', 'beginner', ['box'], true, 'reps'],
    ['Plank to Push-Up', 'plank-to-push-up', 'strength', 'intermediate', [], true, 'reps'],
    ['Shuttle Run', 'shuttle-run', 'cardio', 'beginner', [], true, 'distance'],
    ['SkiErg', 'skierg', 'cardio', 'beginner', ['ski-erg'], false, 'calories'],
    ['BikeErg', 'bikeerg', 'cardio', 'beginner', ['bike-erg'], false, 'calories'],
    ['Running Intervals', 'running-intervals', 'cardio', 'beginner', [], true, 'distance'],
    ['Row Sprint', 'row-sprint', 'cardio', 'intermediate', ['rower'], false, 'distance'],
    ['Running with Sandbag', 'running-with-sandbag', 'cardio', 'intermediate', ['sandbag'], false, 'distance'],
    ['Snatch Balance', 'snatch-balance', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Push Snatch', 'push-snatch', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Hang Snatch', 'hang-snatch', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Clean', 'clean', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Thruster', 'thruster', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Cluster', 'cluster', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Push Press', 'push-press', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Power Clean', 'power-clean', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Jerk', 'jerk', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Overhead Squat', 'overhead-squat', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Push Jerk', 'push-jerk', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Squat Clean', 'squat-clean', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Split Jerk', 'split-jerk', 'olympic_lifting', 'advanced', ['barbell', 'plates'], false, 'weight'],
    ['Sumo Deadlift High Pull', 'sumo-deadlift-high-pull', 'olympic_lifting', 'intermediate', ['barbell', 'plates'], false, 'weight'],
    ['Wall Walk', 'wall-walk', 'gymnastics', 'intermediate', ['wall'], true, 'reps'],
    ['Handstand Walk', 'handstand-walk', 'gymnastics', 'advanced', [], true, 'distance'],
    ['Handstand Hold', 'handstand-hold', 'gymnastics', 'advanced', [], true, 'time'],
    ['Ring Muscle-Up', 'ring-muscle-up', 'gymnastics', 'advanced', ['rings'], true, 'reps'],
    ['Ring Dip', 'ring-dip', 'gymnastics', 'intermediate', ['rings'], true, 'reps'],
    ['Rope Climb', 'rope-climb', 'gymnastics', 'intermediate', ['climbing-rope'], true, 'reps'],
    ['L-Sit', 'l-sit', 'gymnastics', 'advanced', ['parallettes'], true, 'time'],
    ['GHD Sit-Up', 'ghd-sit-up', 'gymnastics', 'advanced', ['ghd'], true, 'reps'],
    ['Strict Toes-to-Bar', 'strict-toes-to-bar', 'gymnastics', 'advanced', ['pull-up-bar'], true, 'reps'],
    ['Dumbbell Snatch', 'dumbbell-snatch', 'olympic_lifting', 'beginner', ['dumbbell'], false, 'reps'],
    ["Farmer's Carry", 'farmers-carry', 'strength', 'beginner', ['dumbbell'], false, 'distance'],
    ['Sandbag Carry', 'sandbag-carry', 'strength', 'intermediate', ['sandbag'], false, 'distance'],
]

const exerciseRows = definitions.map(([name, slug, category, difficulty, equipment, bodyweightOnly, measurementType]) => ({
    name,
    slug,
    category,
    difficulty,
    description: null,
    instructions: null,
    muscle_groups: JSON.stringify([]),
    scaling_options: JSON.stringify([]),
    equipment_required: JSON.stringify(equipment),
    bodyweight_only: bodyweightOnly,
    measurement_type: measurementType,
    contraindications: JSON.stringify([]),
    safety_notes: null,
    video_url: null,
    image_url: null,
    isActive: true,
}))

const slugs = definitions.map(([, slug]) => slug)

export async function up(knex: Knex): Promise<void> {
    await knex('exercises').insert(exerciseRows).onConflict('slug').ignore()
}

export async function down(knex: Knex): Promise<void> {
    await knex('exercises').whereIn('slug', slugs).del()
}