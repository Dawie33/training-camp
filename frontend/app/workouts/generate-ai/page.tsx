'use client'

import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { GeneratedWorkout, generateWorkoutWithAI, sportsService, workoutsService } from '@/lib/api'
import { ExerciseDifficulty } from '@/lib/types/exercice'
import { Sport } from '@/lib/types/sport'
import { WORKOUT_TYPES_BY_SPORT } from '@/lib/types/workout-structure'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BlocksEditor } from '../[id]/components/BlocksEditor'

export default function GenerateWorkoutAIPage() {
  const router = useRouter()
  const [sport, setSport] = useState('crossfit')
  const [workoutType, setWorkoutType] = useState('technique_metcon')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('intermediate')
  const [duration, setDuration] = useState(45)
  const [additionalInstructions, setAdditionalInstructions] = useState('')

  const [loading, setLoading] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sports, setSports] = useState<Sport[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // États pour l'édition
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedDifficulty, setEditedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('intermediate')
  const [editedDuration, setEditedDuration] = useState(0)
  const [editedIntensity, setEditedIntensity] = useState<'low' | 'moderate' | 'high' | 'very_high'>('moderate')
  const [editedBlocks, setEditedBlocks] = useState('')

  // Charger les sports au montage du composant
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const result = await sportsService.getAll()
        setSports(result.rows)
      } catch (err) {
        console.error('Error loading sports:', err)
        toast.error('Failed to load sports')
      }
    }
    fetchSports()
  }, [])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)

      const workout = await generateWorkoutWithAI({
        sport,
        workoutType,
        difficulty,
        duration,
        additionalInstructions: additionalInstructions || undefined
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

      // Trouver le sport_id correspondant au slug sélectionné
      const selectedSport = sports.find(s => s.slug === sport)
      if (!selectedSport) {
        setError('Sport non trouvé')
        return
      }

      // Parser les blocks édités
      let parsedBlocks
      try {
        parsedBlocks = JSON.parse(editedBlocks)
      } catch {
        setError('Erreur dans le format des blocks')
        return
      }

      // Créer le workout personnalisé en base de données avec les valeurs éditées
      const workoutData: any = {
        name: editedName,
        description: editedDescription,
        workout_type: generatedWorkout.workout_type,
        sport_id: selectedSport.id,
        blocks: parsedBlocks,
        estimated_duration: editedDuration,
        intensity: editedIntensity,
        difficulty: editedDifficulty,
        tags: generatedWorkout.tags,
        status: 'published',
        isActive: true,
        isFeatured: false,
        isPublic: false,
        ai_generated: true,
        is_benchmark: false
      }

      const savedWorkout = await workoutsService.create(workoutData as any)

      // Rediriger vers la page du workout personnalisé créé
      toast.success('Workout généré et sauvegardé avec succès !')
      router.push(`/workouts/${savedWorkout.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const workoutTypes = WORKOUT_TYPES_BY_SPORT[sport as keyof typeof WORKOUT_TYPES_BY_SPORT] || []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Générer un Workout avec l'IA</h1>
        <p className="text-muted-foreground mt-2">
          Laissez l'IA créer un workout personnalisé en fonction de vos paramètres
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Paramètres du Workout</h2>

            {/* Sport */}
            <div>
              <label className="block text-sm font-medium mb-2">Sport</label>
              <select
                value={sport}
                onChange={(e) => {
                  setSport(e.target.value)
                  setWorkoutType(WORKOUT_TYPES_BY_SPORT[e.target.value as keyof typeof WORKOUT_TYPES_BY_SPORT]?.[0]?.value || '')
                }}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="crossfit">CrossFit</option>
                <option value="running">Course à pied</option>
                <option value="cycling">Cyclisme</option>
                <option value="musculation">Musculation</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>

            {/* Type de workout */}
            <div>
              <label className="block text-sm font-medium mb-2">Type de Workout</label>
              <select
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                {workoutTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulté */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulté</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Durée totale : {duration} minutes
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Instructions additionnelles */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Instructions additionnelles (optionnel)
              </label>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Ex: Focus haut du corps, sans sauts, avec battle rope..."
                className="w-full px-3 py-2 border rounded-lg bg-background min-h-[100px]"
              />
            </div>

            {/* Bouton */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Génération en cours...
                </span>
              ) : (
                '🤖 Générer le Workout'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Résultat */}
        <div className="space-y-6">
          {generatedWorkout ? (
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-semibold bg-background border rounded px-3 py-2 flex-1 mr-4"
                    placeholder="Nom du workout"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{editedName}</h2>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isEditing ? '👁️ Prévisualiser' : '✏️ Modifier'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-background border rounded px-3 py-2 min-h-[80px]"
                  placeholder="Description du workout"
                />
              ) : (
                <p className="text-muted-foreground">{editedDescription}</p>
              )}

              {isEditing ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Difficulté</label>
                    <select
                      value={editedDifficulty}
                      onChange={(e) => setEditedDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded bg-background text-sm"
                    >
                      <option value="beginner">Débutant</option>
                      <option value="intermediate">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                      <option value="elite">Elite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Durée (min)</label>
                    <input
                      type="number"
                      value={editedDuration}
                      onChange={(e) => setEditedDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded bg-background text-sm"
                      min="5"
                      max="180"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Intensité</label>
                    <select
                      value={editedIntensity}
                      onChange={(e) => setEditedIntensity(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded bg-background text-sm"
                    >
                      <option value="low">Faible</option>
                      <option value="moderate">Modérée</option>
                      <option value="high">Élevée</option>
                      <option value="very_high">Très élevée</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {editedDifficulty}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {editedDuration} min
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {editedIntensity}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Structure du Workout</h3>
                {isEditing ? (
                  <BlocksEditor
                    value={editedBlocks}
                    onChange={setEditedBlocks}
                  />
                ) : (
                  editedBlocks && (() => {
                    try {
                      return <WorkoutDisplay blocks={JSON.parse(editedBlocks)} showTitle={false} />
                    } catch {
                      return <p className="text-muted-foreground">Erreur de format</p>
                    }
                  })()
                )}
              </div>

              {generatedWorkout.tags && generatedWorkout.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {generatedWorkout.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
              <div className="text-6xl mb-4">🤖</div>
              <p>Le workout généré apparaîtra ici</p>
              <p className="text-sm mt-2">Configurez les paramètres et cliquez sur "Générer"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
