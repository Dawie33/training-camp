import { BlocksEditor } from '@/app/(app)/workouts/[id]/components/BlocksEditor'
import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { ExerciseDifficulty } from '@/domain/entities/exercise'
import { GeneratedWorkout } from '@/services'

interface AiGeneratedResultProps {
  generatedWorkout: GeneratedWorkout | null
  personalized: boolean
  isEditing: boolean
  onToggleEdit: () => void
  editedName: string
  setEditedName: (v: string) => void
  editedDescription: string
  setEditedDescription: (v: string) => void
  editedDifficulty: ExerciseDifficulty
  setEditedDifficulty: (v: ExerciseDifficulty) => void
  editedDuration: number
  setEditedDuration: (v: number) => void
  editedIntensity: 'low' | 'moderate' | 'high' | 'very_high'
  setEditedIntensity: (v: 'low' | 'moderate' | 'high' | 'very_high') => void
  editedBlocks: string
  setEditedBlocks: (v: string) => void
  loading: boolean
  onSave: () => void
}

const editSelectClass = 'w-full px-3 py-2 rounded-md bg-secondary/40 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'

export function AiGeneratedResult({
  generatedWorkout, personalized,
  isEditing, onToggleEdit,
  editedName, setEditedName,
  editedDescription, setEditedDescription,
  editedDifficulty, setEditedDifficulty,
  editedDuration, setEditedDuration,
  editedIntensity, setEditedIntensity,
  editedBlocks, setEditedBlocks,
  loading, onSave,
}: AiGeneratedResultProps) {
  if (!generatedWorkout) {
    return (
      <div className="bg-card rounded-lg p-8 lg:p-12 text-center border border-dashed border-border">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">IA</span>
        </div>
        <p className="text-foreground font-medium">Le workout généré apparaîtra ici</p>
        <p className="text-sm text-muted-foreground mt-1">Configure les paramètres et clique sur « Générer »</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header du workout généré */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Bandeau succès */}
        <div className="bg-green-600/10 border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-700 text-sm font-semibold">Workout généré avec succès</span>
            {personalized && (
              <span className="px-2 py-0.5 bg-green-600/10 text-green-700 text-xs font-medium rounded-full border border-green-600/30">
                Généré sur mesure pour vous
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleEdit}
              className="px-3 py-1.5 rounded-md bg-secondary/40 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground text-xs font-medium transition-colors"
            >
              {isEditing ? 'Prévisualiser' : 'Modifier'}
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Titre + meta */}
        <div className="p-4 lg:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-10 bg-primary rounded-full flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl lg:text-3xl font-bold bg-secondary/40 border border-border rounded-md px-3 py-2 w-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nom du workout"
                />
              ) : (
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{editedName}</h2>
              )}

              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 mt-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[60px]"
                  placeholder="Description du workout"
                />
              ) : (
                editedDescription && (
                  <p className="text-muted-foreground text-sm lg:text-base mt-2 italic">{editedDescription}</p>
                )
              )}
            </div>
          </div>

          {/* Badges / champs éditables */}
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Difficulté</label>
                <select
                  value={editedDifficulty}
                  onChange={(e) => setEditedDifficulty(e.target.value as ExerciseDifficulty)}
                  className={editSelectClass}
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
                <input
                  type="number"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(Number(e.target.value))}
                  className={editSelectClass}
                  min="5"
                  max="180"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Intensité</label>
                <select
                  value={editedIntensity}
                  onChange={(e) => setEditedIntensity(e.target.value as 'low' | 'moderate' | 'high' | 'very_high')}
                  className={editSelectClass}
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
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold">
                {generatedWorkout.workout_type?.replace(/_/g, ' ')}
              </span>
              <span className="px-3 py-1 bg-secondary/60 text-foreground rounded-full text-xs lg:text-sm">
                {editedDifficulty}
              </span>
              <span className="text-muted-foreground text-xs lg:text-sm">{editedDuration} min</span>
              <span className="text-muted-foreground text-xs lg:text-sm">Intensité : {editedIntensity}</span>
            </div>
          )}

          {!isEditing && generatedWorkout.tags && generatedWorkout.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {generatedWorkout.tags.map((tag: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 bg-secondary/40 border border-border rounded-md text-xs text-muted-foreground">
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
          <div className="bg-slate-900 rounded-lg p-4 lg:p-6 border border-border">
            <h3 className="font-bold mb-4 text-lg text-white">Structure du Workout</h3>
            <BlocksEditor value={editedBlocks} onChange={setEditedBlocks} />
          </div>
        ) : (
          editedBlocks && (() => {
            try {
              return <WorkoutDisplay blocks={JSON.parse(editedBlocks)} showTitle={false} />
            } catch {
              return (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 text-destructive text-sm">
                  Erreur de format dans les blocks
                </div>
              )
            }
          })()
        )}
      </div>
    </div>
  )
}
