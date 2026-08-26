// ============================================================================
// CATALOGUE D'ÉQUIPEMENT POUR LA SÉLECTION UTILISATEUR (profil + génération IA)
// Source de vérité unique pour EquipmentTab, GenerateForm, AiGenerateForm et
// GenerateStrengthForm — ne pas dupliquer ces listes dans les composants.
// ============================================================================

export interface EquipmentOption {
  value: string
  label: string
}

export interface EquipmentCategoryGroup {
  category: string
  items: EquipmentOption[]
}

export const EQUIPMENT_CATEGORIES: EquipmentCategoryGroup[] = [
  {
    category: 'Basique',
    items: [
      { value: 'bodyweight', label: 'Poids du corps' },
      { value: 'mat', label: 'Tapis' },
      { value: 'band', label: 'Bande élastique' },
    ],
  },
  {
    category: 'Haltérophilie',
    items: [
      { value: 'barbell', label: 'Barre olympique' },
      { value: 'plates', label: 'Disques' },
      { value: 'bumper-plates', label: 'Disques bumper' },
      { value: 'rack', label: 'Rack' },
      { value: 'bench', label: 'Banc' },
      { value: 'dumbbell', label: 'Haltères' },
      { value: 'kettlebell', label: 'Kettlebell' },
      { value: 'ez-bar', label: 'Barre EZ' },
      { value: 'trap-bar', label: 'Trap bar' },
      { value: 'landmine', label: 'Landmine' },
    ],
  },
  {
    category: 'CrossFit',
    items: [
      { value: 'box', label: 'Box' },
      { value: 'pull-up-bar', label: 'Barre de traction' },
      { value: 'jump-rope', label: 'Corde à sauter' },
      { value: 'wall-ball', label: 'Wall ball' },
      { value: 'rings', label: 'Anneaux' },
      { value: 'parallettes', label: 'Parallettes' },
      { value: 'ghd', label: 'GHD' },
      { value: 'medicine-ball', label: 'Medecine ball' },
      { value: 'slam-ball', label: 'Slam ball' },
      { value: 'abmat', label: 'AbMat' },
      { value: 'sandbag', label: 'Sandbag' },
      { value: 'battle-ropes', label: 'Battle ropes' },
    ],
  },
  {
    category: 'Cardio',
    items: [
      { value: 'rower', label: 'Rameur' },
      { value: 'assault-bike', label: 'Assault bike' },
      { value: 'bike-erg', label: 'Bike erg' },
      { value: 'ski-erg', label: 'Ski erg' },
      { value: 'treadmill', label: 'Tapis de course' },
      { value: 'stationary-bike', label: 'Vélo stationnaire' },
      { value: 'elliptical', label: 'Elliptique' },
      { value: 'stairmaster', label: 'Stairmaster' },
    ],
  },
  {
    category: 'Strongman',
    items: [
      { value: 'sled', label: 'Luge' },
      { value: 'tire', label: 'Pneu' },
      { value: 'sledgehammer', label: 'Masse' },
      { value: 'farmer-walk-handles', label: 'Farmer walk' },
      { value: 'yoke', label: 'Yoke' },
      { value: 'atlas-stone', label: 'Atlas stone' },
    ],
  },
  {
    category: 'Accessoires',
    items: [
      { value: 'foam-roller', label: 'Foam roller' },
      { value: 'lacrosse-ball', label: 'Balle lacrosse' },
      { value: 'ab-wheel', label: 'Ab wheel' },
      { value: 'suspension-trainer', label: 'TRX / Suspension' },
      { value: 'plyo-box', label: 'Plyo box' },
      { value: 'pvc-pipe', label: 'Barre PVC' },
    ],
  },
]

export const EQUIPMENT_PRESET_MINIMAL = ['bodyweight', 'mat']

export const EQUIPMENT_PRESET_HOME = [
  'bodyweight', 'mat', 'band', 'dumbbell', 'kettlebell', 'pull-up-bar', 'jump-rope',
]

// Garder synchronisé avec backend/src/workouts/constants/equipment.constants.ts (EQUIPMENT_PRESETS.crossfit)
export const EQUIPMENT_PRESET_CROSSFIT_BOX = [
  'bodyweight', 'mat', 'band',
  'barbell', 'bumper-plates', 'rack', 'bench', 'dumbbell', 'kettlebell',
  'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'bike-erg', 'ski-erg', 'sled', 'wall-ball',
  'rings', 'parallettes', 'ghd', 'medicine-ball', 'battle-ropes', 'slam-ball', 'sandbag',
  'abmat', 'tire', 'sledgehammer', 'farmer-walk-handles', 'landmine',
]

export const EQUIPMENT_PRESETS = [
  { label: 'Minimal', items: EQUIPMENT_PRESET_MINIMAL },
  { label: 'Home gym', items: EQUIPMENT_PRESET_HOME },
  { label: 'Box CrossFit', items: EQUIPMENT_PRESET_CROSSFIT_BOX },
]
