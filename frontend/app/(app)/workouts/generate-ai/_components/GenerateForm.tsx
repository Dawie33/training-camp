import { ExerciseDifficulty } from '@/domain/entities/exercise'
import { WORKOUT_TYPES } from '@/domain/entities/workout-structure'
import { useEffect, useState } from 'react'

const BOX_EQUIPMENT = [
  'bodyweight', 'barbell', 'plates', 'rack', 'bench', 'dumbbell', 'kettlebell',
  'box', 'pull-up-bar', 'jump-rope', 'wall-ball', 'rings', 'parallettes',
  'ghd', 'abmat', 'medicine-ball', 'slam-ball', 'sandbag', 'battle-ropes',
  'rower', 'assault-bike', 'ski-erg',
]

const EQUIPMENT_CATEGORIES = [
  {
    category: 'Basique', items: [
      { value: 'bodyweight', label: 'Poids du corps' },
      { value: 'mat', label: 'Tapis' },
      { value: 'band', label: 'Bande élastique' },
    ]
  },
  {
    category: 'Haltérophilie', items: [
      { value: 'barbell', label: 'Barre olympique' },
      { value: 'plates', label: 'Disques' },
      { value: 'rack', label: 'Rack' },
      { value: 'bench', label: 'Banc' },
      { value: 'dumbbell', label: 'Haltères' },
      { value: 'kettlebell', label: 'Kettlebell' },
      { value: 'ez-bar', label: 'Barre EZ' },
      { value: 'trap-bar', label: 'Trap bar' },
    ]
  },
  {
    category: 'CrossFit', items: [
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
    ]
  },
  {
    category: 'Cardio', items: [
      { value: 'rower', label: 'Rameur' },
      { value: 'assault-bike', label: 'Assault bike' },
      { value: 'ski-erg', label: 'Ski erg' },
      { value: 'treadmill', label: 'Tapis de course' },
      { value: 'stationary-bike', label: 'Vélo stationnaire' },
      { value: 'elliptical', label: 'Elliptique' },
      { value: 'stairmaster', label: 'Stairmaster' },
    ]
  },
  {
    category: 'Strongman', items: [
      { value: 'sled', label: 'Luge' },
      { value: 'tire', label: 'Pneu' },
      { value: 'sledgehammer', label: 'Masse' },
      { value: 'farmer-walk-handles', label: 'Farmer walk' },
      { value: 'yoke', label: 'Yoke' },
      { value: 'atlas-stone', label: 'Atlas stone' },
    ]
  },
  {
    category: 'Accessoires', items: [
      { value: 'foam-roller', label: 'Foam roller' },
      { value: 'lacrosse-ball', label: 'Balle lacrosse' },
      { value: 'ab-wheel', label: 'Ab wheel' },
      { value: 'suspension-trainer', label: 'TRX / Suspension' },
      { value: 'plyo-box', label: 'Plyo box' },
      { value: 'pvc-pipe', label: 'Barre PVC' },
    ]
  },
]

type EquipmentMode = 'bodyweight' | 'home' | 'box' | 'custom'

const MODES: { id: EquipmentMode; icon: string; label: string; description: string }[] = [
  { id: 'bodyweight', icon: '🏃', label: 'Poids du corps', description: 'Sans matériel' },
  { id: 'home', icon: '🏠', label: 'Maison', description: 'Ton équipement' },
  { id: 'box', icon: '🏋️', label: 'Box', description: 'Matériel complet' },
  { id: 'custom', icon: '⚙️', label: 'Personnalisé', description: 'Choix manuel' },
]


const selectClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors'

interface GenerateFormProps {
  workoutType: string
  setWorkoutType: (v: string) => void
  difficulty: ExerciseDifficulty
  setDifficulty: (v: ExerciseDifficulty) => void
  duration: number
  setDuration: (v: number) => void
  equipment: string[]
  setEquipment: (v: string[]) => void
  toggleEquipment: (item: string) => void
  profileEquipment: string[]
  additionalInstructions: string
  setAdditionalInstructions: (v: string) => void
  personalized: boolean
  setPersonalized: (v: boolean) => void
  loading: boolean
  error: string | null
  onGenerate: () => void
}

export function GenerateForm({
  workoutType, setWorkoutType,
  difficulty, setDifficulty,
  duration, setDuration,
  equipment, setEquipment, toggleEquipment,
  profileEquipment,
  additionalInstructions, setAdditionalInstructions,
  personalized, setPersonalized,
  loading, error,
  onGenerate,
}: GenerateFormProps) {
  const [mode, setMode] = useState<EquipmentMode>('home')

  const selectMode = (newMode: EquipmentMode) => {
    setMode(newMode)
    if (newMode === 'bodyweight') setEquipment(['bodyweight'])
    else if (newMode === 'home') setEquipment(profileEquipment)
    else if (newMode === 'box') setEquipment(BOX_EQUIPMENT)
    else if (newMode === 'custom') setEquipment([])
  }

  // Quand le profil charge, on met à jour l'équipement si on est en mode Maison
  useEffect(() => {
    if (mode === 'home') setEquipment(profileEquipment)
  }, [profileEquipment]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-700/50 space-y-4 lg:space-y-5">
      <h2 className="text-lg lg:text-xl font-bold">Paramètres du Workout</h2>

      {/* Toggle Mode Coach Personnalisé */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
        <div>
          <p className="text-sm font-semibold text-white">Mode coach personnalisé</p>
          <p className="text-xs text-slate-400 mt-0.5">Adapte le workout à votre profil, 1RMs et historique</p>
        </div>
        <div className="flex items-center gap-2">
          {personalized && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
              Basé sur votre profil
            </span>
          )}
          <button
            type="button"
            onClick={() => setPersonalized(!personalized)}
            className={`relative w-11 h-6 rounded-full transition-colors ${personalized ? 'bg-orange-500' : 'bg-slate-700'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${personalized ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      {/* Type de workout + Difficulté */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Type de Workout</label>
          <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} className={selectClass}>
            {WORKOUT_TYPES.crossfit.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Difficulté
            {personalized && <span className="ml-2 text-xs text-slate-500 font-normal">(déterminé par votre profil)</span>}
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
            disabled={personalized}
            className={`${selectClass} ${personalized ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
            <option value="elite">Elite</option>
          </select>
        </div>
      </div>

      {/* Durée */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Durée totale : <span className="text-orange-400 font-bold">{duration} min</span>
        </label>
        <input
          type="range"
          min="15"
          max="120"
          step="5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Environnement d'entraînement */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Environnement d'entraînement</label>

        {/* Sélecteur de mode */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MODES.map((m) => {
            const isActive = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMode(m.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${isActive
                  ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                  : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs font-semibold leading-tight">{m.label}</span>
                <span className="text-[10px] text-slate-500 leading-tight">{m.description}</span>
              </button>
            )
          })}
        </div>

        {/* Contenu selon le mode */}
        {mode === 'bodyweight' && (
          <p className="text-xs text-slate-500">Workout sans matériel — poids du corps uniquement.</p>
        )}

        {mode === 'home' && profileEquipment.length === 0 && (
          <p className="text-xs text-amber-400">
            ⚠️ Aucun équipement dans ton profil. Configure-le dans <span className="underline">Profil → Équipement</span>.
          </p>
        )}

        {mode === 'home' && profileEquipment.length > 0 && (
          <p className="text-xs text-slate-500">{profileEquipment.length} équipement{profileEquipment.length > 1 ? 's' : ''} depuis ton profil.</p>
        )}

        {mode === 'box' && (
          <p className="text-xs text-slate-500">Matériel complet d'une box CrossFit — barre, rack, haltères, rameur, assault bike...</p>
        )}

        {mode === 'custom' && (
          <div className="space-y-3 rounded-xl p-3 bg-slate-900/50 border border-slate-700/50">
            {EQUIPMENT_CATEGORIES.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{group.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => {
                    const isSelected = equipment.includes(item.value)
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleEquipment(item.value)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30'
                          : 'border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {equipment.length > 0 && (
              <p className="text-xs text-orange-400 pt-1 font-medium">
                {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Instructions additionnelles */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Instructions additionnelles</label>
        <textarea
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          placeholder="Ex: Focus haut du corps, sans sauts..."
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
        />
      </div>

      {/* Bouton générer */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full px-6 py-3 lg:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            {personalized ? 'Analyse de votre profil et génération...' : 'Génération en cours...'}
          </span>
        ) : (
          'Générer le Workout'
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">{error}</div>
      )}
    </div>
  )
}
