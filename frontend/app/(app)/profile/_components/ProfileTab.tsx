import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { User } from '@/domain/entities/auth'

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-colors'

interface ProfileTabProps {
  fullUser: User | null
  authEmail?: string
  firstName: string
  setFirstName: (v: string) => void
  lastName: string
  setLastName: (v: string) => void
  sportLevel: string
  setSportLevel: (v: string) => void
  height: string
  setHeight: (v: string) => void
  weight: string
  setWeight: (v: string) => void
  bodyFat: string
  setBodyFat: (v: string) => void
  maxHeartRate: string
  setMaxHeartRate: (v: string) => void
  saving: boolean
  onSave: () => void
}

export function ProfileTab({
  fullUser, authEmail,
  firstName, setFirstName,
  lastName, setLastName,
  sportLevel, setSportLevel,
  height, setHeight,
  weight, setWeight,
  bodyFat, setBodyFat,
  maxHeartRate, setMaxHeartRate,
  saving, onSave,
}: ProfileTabProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-5">
      <h2 className="font-display text-2xl font-semibold">Informations personnelles</h2>

      <div>
        <label htmlFor="field-profiletab-0" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
        <Input id="field-profiletab-0"
          type="email"
          value={fullUser?.email ?? authEmail ?? ''}
          readOnly
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-muted-foreground cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-profiletab-1" className="block text-sm font-medium text-foreground mb-1.5">Prénom</label>
          <Input id="field-profiletab-1" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className={inputClass} />
        </div>
        <div>
          <label htmlFor="field-profiletab-2" className="block text-sm font-medium text-foreground mb-1.5">Nom</label>
          <Input id="field-profiletab-2" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="field-profiletab-3" className="block text-sm font-medium text-foreground mb-1.5">Niveau sportif</label>
        <select id="field-profiletab-3" value={sportLevel} onChange={(e) => setSportLevel(e.target.value)} className={inputClass}>
          <option value="">Non renseigné</option>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="field-profiletab-4" className="block text-sm font-medium text-foreground mb-1.5">Taille (cm)</label>
          <Input id="field-profiletab-4" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="180" min="100" max="250" className={inputClass} />
        </div>
        <div>
          <label htmlFor="field-profiletab-5" className="block text-sm font-medium text-foreground mb-1.5">Poids (kg)</label>
          <Input id="field-profiletab-5" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" min="30" max="300" step="1" className={inputClass} />
        </div>
        <div>
          <label htmlFor="field-profiletab-6" className="block text-sm font-medium text-foreground mb-1.5">% Graisse</label>
          <Input id="field-profiletab-6" type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="15" min="3" max="60" step="0.1" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="max-heart-rate" className="block text-sm font-medium text-foreground mb-1.5">FC max (bpm)</label>
        <Input id="max-heart-rate" type="number" value={maxHeartRate} onChange={(e) => setMaxHeartRate(e.target.value)} placeholder="190" min="100" max="230" step="1" aria-describedby="max-heart-rate-help" className={inputClass} />
        <p id="max-heart-rate-help" className="text-xs text-muted-foreground mt-1.5">
          La plus haute FC atteinte sur un effort maximal, par exemple la fin d&apos;un 5 km à fond. Sert à calculer les zones cardiaques des séances que tu importes.
        </p>
      </div>

      <Button variant="default"
        onClick={onSave}
        disabled={saving}
        className="w-full h-auto whitespace-normal px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
      </Button>
    </div>
  )
}
