'use client'

import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { ExerciseDifficulty } from '@/domain/entities/exercice'
import { CreateWorkoutDTO } from '@/domain/entities/workout'
import { WORKOUT_TYPES } from '@/domain/entities/workout-structure'
import { GeneratedWorkout, generatePersonalizedWorkoutWithAI, generateWorkoutWithAI, workoutsService } from '@/services'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { BlocksEditor } from '../[id]/components/BlocksEditor'

export default function GenerateWorkoutAIPage() {
  const router = useRouter()
  const [workoutType, setWorkoutType] = useState<string>(WORKOUT_TYPES.crossfit[0].value)
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('intermediate')
  const [duration, setDuration] = useState(45)
  const [equipment, setEquipment] = useState<string[]>([])
  const [additionalInstructions, setAdditionalInstructions] = useState('')

  const [personalized, setPersonalized] = useState(true)
  const [loading, setLoading] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // États pour l'édition
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedDifficulty, setEditedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('intermediate')
  const [editedDuration, setEditedDuration] = useState(0)
  const [editedIntensity, setEditedIntensity] = useState<'low' | 'moderate' | 'high' | 'very_high'>('moderate')
  const [editedBlocks, setEditedBlocks] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)

      const workout = personalized
        ? await generatePersonalizedWorkoutWithAI({
            workoutType,
            duration,
            equipment: equipment.length > 0 ? equipment : undefined,
            additionalInstructions: additionalInstructions || undefined,
          })
        : await generateWorkoutWithAI({
            workoutType,
            difficulty,
            duration,
            equipment: equipment.length > 0 ? equipment : undefined,
            additionalInstructions: additionalInstructions || undefined,
          })

      setGeneratedWorkout(workout)
      // Initialiser les champs éditables
      setEditedName(workout.name)
      setEditedDescription(workout.description)
      setEditedDifficulty(workout.difficulty)
      setEditedDuration(workout.estimated_duration)
      setEditedIntensity(workout.intensity)
      setEditedBlocks(JSON.stringify(workout.blocks, null, 2))
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedWorkout) return

    try {
      setLoading(true)
      setError(null)

      // Parser les blocks édités
      let parsedBlocks
      try {
        parsedBlocks = JSON.parse(editedBlocks)
      } catch {
        setError('Erreur dans le format des blocks')
        return
      }

      // Créer le workout personnalisé en base de données avec les valeurs éditées
      const workoutData: CreateWorkoutDTO = {
        name: editedName,
        description: editedDescription,
        workout_type: generatedWorkout.workout_type,
        blocks: parsedBlocks,
        estimated_duration: editedDuration,
        intensity: editedIntensity,
        difficulty: editedDifficulty,
        tags: generatedWorkout.tags,
        status: 'published',
        isActive: true,
        isFeatured: false,
        isPublic: false
      }

      await workoutsService.create(workoutData)

      // Rediriger vers la liste des workouts
      toast.success('Workout généré et sauvegardé avec succès !')
      router.push('/workouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const workoutTypes = WORKOUT_TYPES.crossfit

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-700/50 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <span className="text-sm lg:text-base">&larr;</span>
          </button>
          <div className="w-1.5 lg:w-2 h-8 lg:h-12 bg-orange-500 rounded-full"></div>
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">Générer un Workout</h1>
            <p className="text-slate-400 text-sm lg:text-base mt-0.5">
              Laissez l'IA créer un workout personnalisé
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="space-y-6 lg:space-y-8">
          {/* Formulaire */}
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
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                  >
                    {workoutTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulté
                    {personalized && (
                      <span className="ml-2 text-xs text-slate-500 font-normal">(déterminé par votre profil)</span>
                    )}
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
                    disabled={personalized}
                    className={`w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors ${personalized ? 'opacity-40 cursor-not-allowed' : ''}`}
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

              {/* Équipement disponible */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Équipement disponible
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Sélectionnez l'équipement dont vous disposez. Si vide, l'IA génère sans contrainte.
                </p>

                {/* Presets rapides */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { label: 'Minimal', items: ['bodyweight', 'mat'] },
                    { label: 'Home gym', items: ['bodyweight', 'mat', 'band', 'dumbbell', 'kettlebell', 'pull-up-bar', 'jump-rope'] },
                    { label: 'Box CrossFit', items: ['barbell', 'plates', 'rack', 'dumbbell', 'kettlebell', 'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'wall-ball', 'rings', 'medicine-ball', 'ghd'] },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEquipment(preset.items)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {equipment.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEquipment([])}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                {/* Grille d'équipements par catégorie */}
                <div className="space-y-3 rounded-xl p-3 bg-slate-900/50 border border-slate-700/50">
                  {[
                    { category: 'Basique', items: [
                      { value: 'bodyweight', label: 'Poids du corps' },
                      { value: 'mat', label: 'Tapis' },
                      { value: 'band', label: 'Bande élastique' },
                    ]},
                    { category: 'Haltérophilie', items: [
                      { value: 'barbell', label: 'Barre olympique' },
                      { value: 'plates', label: 'Disques' },
                      { value: 'rack', label: 'Rack' },
                      { value: 'bench', label: 'Banc' },
                      { value: 'dumbbell', label: 'Haltères' },
                      { value: 'kettlebell', label: 'Kettlebell' },
                      { value: 'ez-bar', label: 'Barre EZ' },
                      { value: 'trap-bar', label: 'Trap bar' },
                    ]},
                    { category: 'CrossFit', items: [
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
                    ]},
                    { category: 'Cardio', items: [
                      { value: 'rower', label: 'Rameur' },
                      { value: 'assault-bike', label: 'Assault bike' },
                      { value: 'ski-erg', label: 'Ski erg' },
                      { value: 'treadmill', label: 'Tapis de course' },
                      { value: 'stationary-bike', label: 'Vélo stationnaire' },
                      { value: 'elliptical', label: 'Elliptique' },
                      { value: 'stairmaster', label: 'Stairmaster' },
                    ]},
                    { category: 'Strongman', items: [
                      { value: 'sled', label: 'Luge' },
                      { value: 'tire', label: 'Pneu' },
                      { value: 'sledgehammer', label: 'Masse' },
                      { value: 'farmer-walk-handles', label: 'Farmer walk' },
                      { value: 'yoke', label: 'Yoke' },
                      { value: 'atlas-stone', label: 'Atlas stone' },
                    ]},
                    { category: 'Accessoires', items: [
                      { value: 'foam-roller', label: 'Foam roller' },
                      { value: 'lacrosse-ball', label: 'Balle lacrosse' },
                      { value: 'ab-wheel', label: 'Ab wheel' },
                      { value: 'suspension-trainer', label: 'TRX / Suspension' },
                      { value: 'plyo-box', label: 'Plyo box' },
                      { value: 'pvc-pipe', label: 'Barre PVC' },
                    ]},
                  ].map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{group.category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => {
                          const isSelected = equipment.includes(item.value)
                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setEquipment(equipment.filter(e => e !== item.value))
                                } else {
                                  setEquipment([...equipment, item.value])
                                }
                              }}
                              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                                isSelected
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
                </div>

                {/* Résumé sélection */}
                {equipment.length > 0 && (
                  <p className="text-xs text-orange-400 mt-2 font-medium">
                    {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Instructions additionnelles */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instructions additionnelles
                </label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Ex: Focus haut du corps, sans sauts..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
                />
              </div>

              {/* Bouton */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-6 py-3 lg:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {personalized ? 'Analyse de votre profil et génération...' : 'Génération en cours...'}
                  </span>
                ) : (
                  'Générer le Workout'
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  {error}
                </div>
              )}
          </div>

          {/* Résultat */}
          {generatedWorkout ? (
            <div className="space-y-4 lg:space-y-6">
              {/* Header du workout généré */}
              <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Bandeau vert succès */}
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-b border-slate-700/50 px-4 lg:px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm font-semibold">Workout généré avec succès</span>
                    {personalized && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                        Généré sur mesure pour vous
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white text-xs font-medium transition-colors"
                    >
                      {isEditing ? 'Prévisualiser' : 'Modifier'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>

                {/* Titre + badges */}
                <div className="p-4 lg:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-10 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="text-2xl lg:text-3xl font-bold bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          placeholder="Nom du workout"
                        />
                      ) : (
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{editedName}</h2>
                      )}

                      {isEditing ? (
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 mt-3 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none min-h-[60px]"
                          placeholder="Description du workout"
                        />
                      ) : (
                        editedDescription && (
                          <p className="text-slate-400 text-sm lg:text-base mt-2 italic">{editedDescription}</p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Badges info */}
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Difficulté</label>
                        <select
                          value={editedDifficulty}
                          onChange={(e) => setEditedDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'elite')}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        >
                          <option value="beginner">Débutant</option>
                          <option value="intermediate">Intermédiaire</option>
                          <option value="advanced">Avancé</option>
                          <option value="elite">Elite</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Durée (min)</label>
                        <input
                          type="number"
                          value={editedDuration}
                          onChange={(e) => setEditedDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          min="5"
                          max="180"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Intensité</label>
                        <select
                          value={editedIntensity}
                          onChange={(e) => setEditedIntensity(e.target.value as 'low' | 'moderate' | 'high' | 'very_high')}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        >
                          <option value="low">Faible</option>
                          <option value="moderate">Modérée</option>
                          <option value="high">Élevée</option>
                          <option value="very_high">Très élevée</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs lg:text-sm font-semibold">
                        {generatedWorkout.workout_type?.replace(/_/g, ' ')}
                      </span>
                      <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs lg:text-sm">
                        {editedDifficulty}
                      </span>
                      <span className="text-slate-500 text-xs lg:text-sm">
                        {editedDuration} min
                      </span>
                      <span className="text-slate-500 text-xs lg:text-sm">
                        Intensité : {editedIntensity}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {!isEditing && generatedWorkout.tags && generatedWorkout.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {generatedWorkout.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-900/50 border border-slate-700/50 rounded-md text-xs text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Structure du workout */}
              <div className="space-y-4">
                {isEditing ? (
                  <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-700/50">
                    <h3 className="font-bold mb-4 text-lg">Structure du Workout</h3>
                    <BlocksEditor
                      value={editedBlocks}
                      onChange={setEditedBlocks}
                    />
                  </div>
                ) : (
                  editedBlocks && (() => {
                    try {
                      return <WorkoutDisplay blocks={JSON.parse(editedBlocks)} showTitle={false} />
                    } catch {
                      return (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                          Erreur de format dans les blocks
                        </div>
                      )
                    }
                  })()
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-700/50 border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-600">AI</span>
              </div>
              <p className="text-slate-400 font-medium">Le workout généré apparaîtra ici</p>
              <p className="text-sm text-slate-600 mt-1">Configurez les paramètres et cliquez sur "Générer"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
