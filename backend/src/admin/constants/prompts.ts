import { SportSlug } from "../types/workout.types"
import { EQUIPMENT } from "./schemas"

const equipmentList = EQUIPMENT.join('", "')
/**
 * Génère un prompt système pour un sport donné et une date.
 * @param sport Liste des sports supportés
 * @param date Date au format ISO (yyyy-mm-dd)
 * @returns Prompt système
 */
export function buildSystemPromptForSport(sport: SportSlug, date: string, availableEquipment?: string[]) {

  const inv = availableEquipment && availableEquipment.length
    ? `Équipement disponible (utilise SEULEMENT ce qui est dans cette liste): ["${availableEquipment.join('", "')}"].
    Tu peux utiliser tout cet équipement librement pour créer des workouts variés et complets.`
    : `Équipement: Tu as accès à tout l'équipement d'une salle de sport moderne. Utilise librement:
    - Free weights: barbell, plates, rack, bench, dumbbell, kettlebell
    - Machines: cable-machine, lat-pulldown, leg-press, chest-press-machine, seated-row-machine, etc.
    - Cardio: treadmill, stationary-bike, rower, assault-bike
    - Accessories: mat, band, box, pull-up-bar, jump-rope, medicine-ball, etc.`

  const commonRules = `
    Tu es un coach ${sport} expérimenté. Retourne EXCLUSIVEMENT du JSON valide.
    - La séance doit être prévue pour la date ${date} (champ "date" dans le JSON).
    - Chaque mouvement PEUT inclure "equipment": string[] avec des slugs parmi: ["${equipmentList}"].
    - ${inv}
    - Crée des workouts variés et efficaces en utilisant l'équipement disponible.
    - Durée totale <= 60 minutes.

    CHAMPS OBLIGATOIRES:
    - "name": Nom accrocheur du workout (ex: "Killer Legs", "Sweet Spot Crusher", "Upper Body Pump")
    - "workout_type": Type du workout (amrap, for_time, emom, intervals, strength, endurance, tempo, fartlek, etc.)
    - "difficulty": Niveau requis ("beginner", "intermediate", "advanced")
    - "intensity": Intensité ("low", "moderate", "high", "very_high")
    - "description": 1-2 phrases décrivant l'objectif du workout
    - "coach_notes": Conseils techniques pour bien réaliser le workout (échauffement, technique, récupération, etc.)

    - Pas de texte hors JSON.`


  switch (sport) {
    case 'crossfit':
      return `${commonRules}
    Structure: warmup + (strength optionnel) + metcon + accessory + (cooldown optionnel).
    Le metcon peut être "For Time", "AMRAP" ou "EMOM". Utilise "substitutions" si l'inventaire ne contient pas le matériel idéal.`


    case 'running':
      return `${commonRules}
    Structure: warmup (Z1), metcon au format "Intervals" (parts avec distance_m ou duration_min + target_zone + r_rest_sec), cooldown.
    target_zone ∈ {"E","M","T","I","R"} (selon Daniels).
    Pas de strength lourd ici, "strength" doit rester absent sauf renfo léger en accessory.`

    case 'cycling':
      return `Tu es un coach Cycling. Retourne EXCLUSIVEMENT du JSON valide.
    - Structure: warmup, metcon au format "Intervals" (parts avec duration_min + target_pct_ftp + r_rest_sec), cooldown.
    - target_pct_ftp ∈ [0.5..1.2] réaliste, par ex. 0.85-0.95 pour sweet spot.
    - Pas de texte hors JSON.`

    case 'musculation':
      return `${commonRules}
    - Structure: warmup (articulaire/léger), strength (mouvement(s) principal(aux)), accessory (2-4 exos), cooldown (étirements).
    - "strength.scheme" doit rendre lisible les séries/répetitions/intensité, ex: "5x5 @75%1RM" ou "4x8 @RIR2".
    - Pas de metcon ici (laisse "metcon" vide ou absent).
    - Tu peux utiliser librement: barbell, dumbbell, machines (leg-press, lat-pulldown, cable-machine, chest-press-machine, etc.), ou bodyweight.
    - Varie les exercices et les méthodes (composés puis isolation, free weights puis machines, etc.).`

    default:
      return `Tu es un coach multi-sports. Retourne EXCLUSIVEMENT du JSON valide.
    - Si sport inconnu, génère une structure générique: warmup + bloc principal (Intervals ou Strength) + accessory + cooldown.`
  }
}

export function exampleSchemaForSport(sport: SportSlug): string {
  if (sport === 'running') {
    return `{
  "date":"YYYY-MM-DD",
  "sportId":"uuid",
  "name":"VO2max Crusher",
  "workout_type":"intervals",
  "difficulty":"intermediate",
  "intensity":"very_high",
  "tags":["endurance","intervals"],
  "description":"Séance de VO2max pour améliorer ta vitesse maximale aérobie avec des intervalles courts.",
  "coach_notes":"Échauffement progressif obligatoire. Chaque intervalle à 95-100% de ton effort max. Récupération active en trottinant légèrement. Hydrate-toi bien.",
  "blocks":{
    "duration_min":50,
    "stimulus":"VO2max focus",
    "warmup":[{"movement":"Jog Z1","duration_sec":600}],
    "metcon":{
      "format":"Intervals",
      "parts":[
        {"movement":"Run","distance_m":400,"target_zone":"I","r_rest_sec":90},
        {"movement":"Run","distance_m":400,"target_zone":"I","r_rest_sec":90},
        {"movement":"Run","distance_m":400,"target_zone":"I","r_rest_sec":90}
      ]
    },
    "cooldown":[{"movement":"Jog Easy","duration_sec":300}]
  }
}`
  }
  if (sport === 'cycling') {
    return `{
  "date":"YYYY-MM-DD",
  "sportId":"uuid",
   "name":"Sweet Spot",
  "workout_type":"intervals",
  "difficulty":"intermediate",
  "intensity":"moderate",
  "tags":["bike","sweetspot"],
  "description":"Travail au sweet spot (88-93% FTP) pour développer ton endurance de force.",
  "coach_notes":"Maintiens une cadence constante entre 85-95 rpm. Concentre-toi sur un pédalage fluide. Reste en position aéro si possible. Bois régulièrement.",
  "blocks":{
    "duration_min":55,
    "stimulus":"Tempo/Sweetspot",
    "warmup":[{"movement":"Spin Easy","duration_sec":600}],
    "metcon":{
      "format":"Intervals",
      "parts":[
        {"movement":"Bike","duration_min":10,"target_pct_ftp":0.9,"r_rest_sec":300},
        {"movement":"Bike","duration_min":10,"target_pct_ftp":0.92,"r_rest_sec":300},
        {"movement":"Bike","duration_min":10,"target_pct_ftp":0.9,"r_rest_sec":300}
      ]
    },
    "cooldown":[{"movement":"Spin Easy","duration_sec":300}]
  }
}`
  }
  if (sport === 'musculation') {
    return `{
  "date":"YYYY-MM-DD",
  "sportId":"uuid",
   "name":"Push Hypertrophy",
  "workout_type":"strength",
  "difficulty":"advanced",
  "intensity":"high",
  "tags":["hypertrophy","upper"],
  "description":"Séance push hypertrophie pour développer pecs, épaules et triceps avec un focus sur le volume.",
  "coach_notes":"Échauffement articulaire important. Sur le bench, descente contrôlée en 2s, pause 1s en bas. Garde les omoplates serrées. Sur les accessoires, cherche la congestion musculaire.",
  "blocks":{
    "duration_min":60,
    "stimulus":"Upper push focus",
    "warmup":[{"movement":"Shoulder CARs","reps":8},{"movement":"Banded external rotation","reps":12}],
    "strength":{"name":"Bench Press","scheme":"5x5 @75%1RM","rest_sec":150,"notes":"Tempo 21X1"},
    "accessory":[
      {"movement":"Incline DB Press","scheme":"3x10 @RIR2"},
      {"movement":"Cable Fly","scheme":"3x12"},
      {"movement":"Triceps Rope Pushdown","scheme":"3x12"}
    ],
    "cooldown":[{"movement":"Doorway Pec Stretch","duration_sec":60}]
  }
}`
  }
  // default/crossfit
  return `{
  "date":"YYYY-MM-DD",
  "sportId":"uuid",
   "name":"Strength + Short Sprint",
  "workout_type":"strength",
  "difficulty":"advanced",
  "intensity":"high",
  "tags":["strength","metcon","short"],
  "description":"Séance combinant force sur le squat et un metcon court et intense style 21-15-9 pour travailler l'explosivité.",
  "coach_notes":"Concentre-toi sur la technique au squat, descente contrôlée. Sur le metcon, casse les séries si besoin mais garde un rythme soutenu. Respiration cruciale sur les burpees.",
  "blocks":{
    "duration_min":45,
    "stimulus":"Lower strength + short sprint",
    "warmup":[{"movement":"Bike Easy","duration_sec":300},{"movement":"World's greatest stretch","reps":8}],
    "strength":{"name":"Back Squat","scheme":"5x3 @80%1RM","rest_sec":150},
    "metcon":{
      "format":"For Time",
      "time_cap_min":10,
      "parts":[
        {"movement":"Front Squat (from floor)","reps":21},
        {"movement":"Burpees","reps":21},
        {"movement":"Front Squat (from floor)","reps":15},
        {"movement":"Burpees","reps":15},
        {"movement":"Front Squat (from floor)","reps":9},
        {"movement":"Burpees","reps":9}
      ],
      "substitutions":{"front_squat":["Goblet Squat (KB)"]}
    },
    "accessory":[{"movement":"Side Plank","scheme":"3x30s/side"}],
    "cooldown":[{"movement":"Quad stretch","duration_sec":60}]
  }
}`
}