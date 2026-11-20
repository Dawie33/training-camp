import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { ExerciseDifficulty } from '@/domain/entities/exercise'
import { GeneratedWorkout } from '@/services'
import { BlocksEditor } from '../../[id]/components/BlocksEditor'

interface GeneratedWorkoutResultProps {
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

const editSelectClass = 'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

/**
 * Affiche le workout généré par l'IA (ou un état vide avant génération), avec bascule
 * entre prévisualisation en lecture seule et édition des champs avant sauvegarde.
 */
export function GeneratedWorkoutResult({
  generatedWorkout, personalized,
  isEditing, onToggleEdit,
  editedName, setEditedName,
  editedDescription, setEditedDescription,
  editedDifficulty, setEditedDifficulty,
  editedDuration, setEditedDuration,
  editedIntensity, setEditedIntensity,
  editedBlocks, setEditedBlocks,
  loading, onSave,
}: GeneratedWorkoutResultProps) {
  if (!generatedWorkout) {
    return (
      <div className="bg-card rounded-xl lg:rounded-lg p-8 lg:p-12 text-center border border-border border-dashed">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-background border border-border flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">AI</span>
        </div>
        <p className="text-muted-foreground font-medium">Le workout généré apparaîtra ici</p>
        <p className="text-sm text-muted-foreground mt-1">Configurez les paramètres et cliquez sur "Générer"</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header du workout généré */}
      <div className="bg-card rounded-xl lg:rounded-lg border border-border overflow-hidden">
        {/* Bandeau succès */}
        <div className="bg-secondary border-b border-border px-4 lg:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-primary text-sm font-semibold">Workout généré avec succès</span>
            {personalized && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full border border-primary/30">
                Généré sur mesure pour vous
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost"
              onClick={onToggleEdit}
              className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground hover:bg-muted hover:text-foreground text-xs font-medium transition-colors"
            >
              {isEditing ? 'Prévisualiser' : 'Modifier'}
            </Button>
            <Button variant="default"
              onClick={onSave}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {/* Titre + meta */}
        <div className="p-4 lg:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-10 bg-primary rounded-full flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl lg:text-3xl font-bold bg-background border border-border rounded-xl px-3 py-2 w-full text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Nom du workout"
                />
              ) : (
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{editedName}</h2>
              )}

              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 mt-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none min-h-[60px]"
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
                <label htmlFor="field-generatedworkoutresult-0" className="block text-xs font-medium text-muted-foreground mb-1">Difficulté</label>
                <select id="field-generatedworkoutresult-0"
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
                <label htmlFor="field-generatedworkoutresult-1" className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
                <Input id="field-generatedworkoutresult-1"
                  type="number"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(Number(e.target.value))}
                  className={editSelectClass}
                  min="5"
                  max="180"
                />
              </div>
              <div>
                <label htmlFor="field-generatedworkoutresult-2" className="block text-xs font-medium text-muted-foreground mb-1">Intensité</label>
                <select id="field-generatedworkoutresult-2"
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
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs lg:text-sm font-semibold">
                {generatedWorkout.workout_type?.replace(/_/g, ' ')}
              </span>
              <span className="px-3 py-1 bg-muted text-foreground rounded-full text-xs lg:text-sm">
                {editedDifficulty}
              </span>
              <span className="text-muted-foreground text-xs lg:text-sm">{editedDuration} min</span>
              <span className="text-muted-foreground text-xs lg:text-sm">Intensité : {editedIntensity}</span>
            </div>
          )}

          {!isEditing && generatedWorkout.tags && generatedWorkout.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {generatedWorkout.tags.map((tag: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 bg-background border border-border rounded-md text-xs text-muted-foreground">
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
          <div className="bg-card rounded-xl lg:rounded-lg p-4 lg:p-6 border border-border">
            <h3 className="font-bold mb-4 text-lg">Structure du Workout</h3>
            <BlocksEditor value={editedBlocks} onChange={setEditedBlocks} />
          </div>
        ) : (
          editedBlocks && (() => {
            try {
              return <WorkoutDisplay blocks={JSON.parse(editedBlocks)} showTitle={false} />
            } catch {
              return (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
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
