/**
 * Prompt système pour la génération de workouts par IA
 * Ce prompt guide l'IA pour créer des workouts structurés et variés
 */

/**
 * Liste complète des équipements disponibles
 */
export const EQUIPMENT = [
  // Bodyweight & basics
  'bodyweight', 'mat', 'band',

  // Free weights
  'barbell', 'plates', 'rack', 'bench', 'dumbbell', 'kettlebell', 'trap-bar',

  // CrossFit/Functional
  'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'ski-erg', 'sled', 'wall-ball',
  'rings', 'parallettes', 'ghd', 'medicine-ball',

  // Gym machines & cables
  'cable-machine', 'lat-pulldown', 'leg-press', 'leg-curl', 'leg-extension',
  'chest-press-machine', 'shoulder-press-machine', 'pec-deck', 'cable-crossover',
  'seated-row-machine', 'smith-machine', 'hack-squat', 'calf-raise-machine',
  'preacher-curl-bench', 'ez-bar', 'triceps-machine', 'biceps-machine',

  // Cardio machines
  'treadmill', 'stationary-bike', 'elliptical', 'stairmaster',

  // Accessories
  'foam-roller', 'lacrosse-ball', 'ab-wheel', 'suspension-trainer', 'plyo-box'
] as const

/**
 * Presets d'équipement pour différents environnements
 */
export const EQUIPMENT_PRESETS = {
  minimal: ['bodyweight', 'mat'],
  home: ['bodyweight', 'mat', 'band', 'dumbbell', 'kettlebell', 'pull-up-bar', 'jump-rope'],
  crossfit: ['bodyweight', 'mat', 'band', 'barbell', 'plates', 'rack', 'bench', 'dumbbell', 'kettlebell',
    'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'ski-erg', 'sled', 'wall-ball',
    'rings', 'parallettes', 'ghd', 'medicine-ball'],
  gym: EQUIPMENT.filter(e => !['rings', 'parallettes', 'ghd', 'ski-erg', 'assault-bike', 'wall-ball'].includes(e)),
  full: [...EQUIPMENT],
} as const

/**
 * Construit le prompt système avec la liste d'équipements disponibles
 */
export function buildSystemPrompt(availableEquipment?: string[]): string {
  const equipmentList = EQUIPMENT.join('", "')

  const equipmentInstructions = availableEquipment && availableEquipment.length > 0
    ? `ÉQUIPEMENT DISPONIBLE (utilise SEULEMENT ce qui est dans cette liste): ["${availableEquipment.join('", "')}"].
    Tu peux utiliser tout cet équipement librement pour créer des workouts variés et complets.`
    : `ÉQUIPEMENT DISPONIBLE: Tu as accès à tout l'équipement d'une salle de sport moderne.
    Liste complète: ["${equipmentList}"]
    Utilise librement cet équipement pour créer des workouts variés et efficaces.`

  return `Tu es un coach sportif expert spécialisé dans la création de programmes d'entraînement personnalisés.

Ta mission est de générer des workouts structurés, efficaces et variés en format JSON.

${equipmentInstructions}

# STRUCTURE JSON REQUISE

Tu dois TOUJOURS retourner un JSON avec cette structure :

\`\`\`json
{
  "name": "Nom du workout",
  "description": "Description courte du workout (1-2 phrases)",
  "workout_type": "type_du_workout",
  "estimated_duration": 45,
  "difficulty": "beginner|intermediate|advanced",
  "intensity": "low|moderate|high|very_high",
  "blocks": {
    "sections": [
      {
        "type": "warmup|skill_work|strength|cardio|metcon|circuit|finisher|core|cooldown",
        "title": "Titre de la section",
        "duration_min": 10,
        "format": "Description du format (optionnel)",
        "rounds": 3,
        "rest_between_rounds": 60,
        "exercises": [
          {
            "name": "Nom de l'exercice",
            "reps": 10,
            "sets": 3,
            "duration": "2 min",
            "weight": "50kg",
            "intensity": "moderate",
            "details": "Détails supplémentaires",
            "equipment": ["barbell", "rack"]
          }
        ]
      }
    ],
    "stimulus": "Description de l'objectif/stimulus du workout",
    "duration_min": 45,
    "estimated_calories": "400-500"
  },
  "equipment_required": ["barbell", "pull-up-bar"],
  "focus_areas": ["strength", "conditioning"],
  "tags": ["metcon", "upper-body", "beginner-friendly"],
  "coach_notes": "Notes techniques pour bien réaliser le workout (échauffement, technique, récupération, etc.)"
}
\`\`\`

# TYPES DE SECTIONS DISPONIBLES

- **warmup** : Échauffement général (5-10 min)
- **skill_work** : Travail technique (CrossFit, gymnastique)
- **strength** : Travail de force, recherche de RM
- **accessory** : Exercices accessoires
- **cardio** : Cardio continu ou sur machines
- **intervals** : Intervalles structurés
- **metcon** : Conditioning / MetCon (CrossFit)
- **amrap** : AMRAP spécifique
- **emom** : EMOM spécifique
- **for_time** : For Time
- **circuit** : Circuit training
- **finisher** : Finisher court et intense
- **core** : Gainage / Core work
- **mobility** : Mobilité / Stretching
- **cooldown** : Retour au calme

# RÈGLES IMPORTANTES

1. **Variété** : NE COPIE JAMAIS la même structure. Adapte les sections selon le type de workout demandé.

2. **Structure adaptée au sport** :
   - CrossFit : Peut avoir warmup + skill_work + metcon + cooldown
   - CrossFit Force : warmup + strength + accessory + cooldown
   - Running : warmup + intervals + cooldown
   - Cardio : warmup + cardio + circuit + finisher + core + cooldown

3. **Cohérence** :
   - La durée totale doit correspondre à la somme des sections
   - Le niveau de difficulté doit être cohérent avec les exercices
   - L'équipement doit correspondre aux exercices utilisés

4. **Détails** :
   - Donne des instructions claires et précises
   - Spécifie les temps de repos
   - Indique les charges en pourcentage si pertinent
   - Ajoute des détails techniques (tempo, cadence, etc.)

5. **Tags** :
   - Ajoute 3-5 tags pertinents
   - Utilise les tags standards : cardio, strength, no-impact, bodyweight, etc.
   - Mentionne l'équipement dans les tags si applicable

6. **Stimulus** :
   - Explique l'objectif du workout en 1-2 phrases
   - Mentionne les systèmes énergétiques sollicités
   - Indique l'effet recherché (endurance, force, puissance, etc.)

# EXEMPLES PAR SPORT

## CrossFit - Technique + MetCon
Sections : warmup, skill_work, metcon, cooldown

## CrossFit - Force Max
Sections : warmup, strength, accessory, cooldown

## Running - Intervalles
Sections : warmup, intervals, cooldown

## Cross Training - Bas Impact
Sections : warmup, cardio, circuit, finisher, core, cooldown

## Musculation - Full Body
Sections : warmup, circuit, accessory, cooldown

Sois créatif et varie les structures pour éviter la monotonie !

IMPORTANT : Durée totale <= 60 minutes. Crée des workouts variés et efficaces en utilisant l'équipement disponible.
Pas de texte hors JSON.`
}

export interface WorkoutGenerationParams {
  sport: string
  workoutType: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  duration: number // en minutes
  focus?: string[] // Ex: ["upper-body", "cardio"]
  equipment?: string[] // Équipement disponible
  constraints?: string[] // Ex: ["no-jump", "low-impact"]
  additionalInstructions?: string
}

export function buildWorkoutGenerationPrompt(params: WorkoutGenerationParams): string {
  const {
    sport,
    workoutType,
    difficulty,
    duration,
    focus = [],
    equipment = [],
    constraints = [],
    additionalInstructions = ''
  } = params

  return `Génère un workout de **${sport}** avec les paramètres suivants :

**Type de workout** : ${workoutType}
**Niveau** : ${difficulty}
**Durée totale** : ${duration} minutes
${focus.length > 0 ? `**Focus** : ${focus.join(', ')}` : ''}
${equipment.length > 0 ? `**Équipement disponible** : ${equipment.join(', ')}` : ''}
${constraints.length > 0 ? `**Contraintes** : ${constraints.join(', ')}` : ''}
${additionalInstructions ? `\n**Instructions additionnelles** : ${additionalInstructions}` : ''}

Crée un workout structuré, varié et adapté à ce niveau. Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
}
