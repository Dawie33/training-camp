'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Equipment {
  id: string
  slug: string
  label: string
  image_url?: string
}

const SPORTS = [
  { value: 'crossfit', label: 'Crossfit' },
]

const LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'elite', label: 'Élite' },
]

const TRAINING_LOCATIONS = [
  { value: 'home', label: 'Maison' },
  { value: 'gym', label: 'Salle de sport' },
  { value: 'outdoor', label: 'Extérieur' },
  { value: 'mixed', label: 'Mixte' },
]

const GOALS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'strength', label: 'Force' },
  { value: 'flexibility', label: 'Mobilité' },
  { value: 'performance', label: 'Performance' },
]

const TOTAL_STEPS = 5

/**
 * Page de création de compte pour les utilisateurs.
 the app
 * Étape 1 : Informations personnelles
 * Étape 2 : Profile athlétique
 * Étape 3 : Objectifs et sports pratiqués
 * Étape 4 : Équipement et lieu d'entraînement
 * Étape 5 : Blessures et limitations
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: '',
    primary_sport: '',
    sports_practiced: [] as string[],
    overall_level: '',
    height: '',
    weight: '',
    training_locations: [] as string[],
    global_goals: {} as Record<string, boolean>,
    equipment_available: [] as string[],
    injuries: '',
    physical_limitations: '',
  })


  useEffect(() => {
    /**
     * Charger les équipements depuis l'API.
     * Récupère les équipements disponibles sous la forme d'un tableau d'objets Equipment.
     * Si une erreur survient lors de la chargement, affiche un message d'erreur dans la console.
     */
    const fetchEquipments = async () => {
      try {
        const response: { rows: Equipment[] } = await apiClient.get('/equipments')
        setEquipments(response.rows || [])
      } catch (error) {
        console.error('Erreur lors de la chargement des équipements', error)
      }
    }
    fetchEquipments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')

      // Déterminer le training_location basé sur les sélections
      let trainingLocation: string | undefined = undefined
      if (formData.training_locations.length === 1) {
        trainingLocation = formData.training_locations[0]
      } else if (formData.training_locations.length > 1) {
        trainingLocation = 'mixed'
      }

      const dataToSend = {
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        primary_sport: formData.primary_sport || undefined,
        sports_practiced: formData.sports_practiced.length > 0 ? formData.sports_practiced : undefined,
        overall_level: formData.overall_level || undefined,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        training_location: trainingLocation,
        global_goals: Object.keys(formData.global_goals).length > 0 ? formData.global_goals : undefined,
        equipment_available: formData.equipment_available.length > 0 ? formData.equipment_available : undefined,
        injuries: formData.injuries ? [formData.injuries] : undefined,
        physical_limitations: formData.physical_limitations ? [formData.physical_limitations] : undefined,
      }

      await apiClient.patch('/auth/profile', dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Erreur dans la mise à jour du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSport = (sport: string) => {
    setFormData({
      ...formData,
      sports_practiced: formData.sports_practiced.includes(sport)
        ? formData.sports_practiced.filter((s) => s !== sport)
        : [...formData.sports_practiced, sport],
    })
  }

  const toggleGoal = (goal: string) => {
    setFormData({
      ...formData,
      global_goals: {
        ...formData.global_goals,
        [goal]: !formData.global_goals[goal],
      },
    })
  }

  const toggleEquipment = (equipment: string) => {
    setFormData({
      ...formData,
      equipment_available: formData.equipment_available.includes(equipment)
        ? formData.equipment_available.filter((e) => e !== equipment)
        : [...formData.equipment_available, equipment],
    })
  }

  const toggleLocation = (location: string) => {
    setFormData({
      ...formData,
      training_locations: formData.training_locations.includes(location)
        ? formData.training_locations.filter((l) => l !== location)
        : [...formData.training_locations, location],
    })
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              Bienvenue{user ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Aide moi à mieux te connaitre
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Genre</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Sélectionne un genre</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Licorne</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Profile athlétique</h2>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sport principal
                  </label>
                  <select
                    value={formData.primary_sport}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_sport: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Sélectionne un sport</option>
                    {SPORTS.map((sport) => (
                      <option key={sport.value} value={sport.value}>
                        {sport.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Niveau d'expérience
                  </label>
                  <select
                    value={formData.overall_level}
                    onChange={(e) =>
                      setFormData({ ...formData, overall_level: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Sélectionne un niveau</option>
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Objectifs et sports pratiqués</h2>

                <div>
                  <label className="block text-sm font-medium mb-2 ">
                    Quels sont tes objectifs ? (plusieurs choix possibles)
                  </label>
                  <div className="grid grid-cols-2 gap-2 ">
                    {GOALS.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => toggleGoal(goal.value)}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${formData.global_goals[goal.value]
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-input hover:bg-accent'
                          }`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Autres sports pratiqués (optionnel)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => toggleSport(sport.value)}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${formData.sports_practiced.includes(sport.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-input hover:bg-accent'
                          }`}
                      >
                        {sport.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Équipement et lieu d'entraînement</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Où t'entraines-tu ? (plusieurs choix possibles)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRAINING_LOCATIONS.map((location) => (
                      <button
                        key={location.value}
                        type="button"
                        onClick={() => toggleLocation(location.value)}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${formData.training_locations.includes(location.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-input hover:bg-accent'
                          }`}
                      >
                        {location.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quel équipement as-tu ? (plusieurs choix possibles)
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {equipments.map((equip) => (
                      <button
                        key={equip.id}
                        type="button"
                        onClick={() => toggleEquipment(equip.slug)}
                        className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center gap-2 transition-all ${formData.equipment_available.includes(equip.slug)
                          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                          : 'border-input hover:bg-accent hover:border-primary/50'
                          }`}
                      >
                        {equip.image_url && (
                          <img
                            src={equip.image_url}
                            alt={equip.label}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                        )}
                        <span className="text-xs text-center leading-tight">{equip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Blessures et limitations</h2>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Blessures actuelles (optionnel)
                  </label>
                  <textarea
                    value={formData.injuries}
                    onChange={(e) =>
                      setFormData({ ...formData, injuries: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    rows={3}
                    placeholder="Ex: Tendinite au genou droit, douleur à l'épaule gauche..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Indique tes blessures actuelles pour adapter les exercices
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Limitations physiques (optionnel)
                  </label>
                  <textarea
                    value={formData.physical_limitations}
                    onChange={(e) =>
                      setFormData({ ...formData, physical_limitations: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    rows={3}
                    placeholder="Ex: Mobilité limitée de la hanche, problème de dos chronique..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mentionne tes limitations pour personnaliser ton entraînement
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent cursor-pointer"
                >
                  Précédent
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Enregistrement...' : step === TOTAL_STEPS ? 'Terminer' : 'Suivant'}
              </button>
            </div>

            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full text-sm text-muted-foreground hover:underline"
              >
                Passer pour plus tard
              </button>
            )}
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
