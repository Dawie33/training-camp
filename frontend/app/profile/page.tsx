'use client'

import { AuthGuard } from '@/components/guards/AuthGuard'
import { User } from '@/domain/entities/auth'
import { useAuth } from '@/hooks/useAuth'
import { CROSSFIT_LIFTS, OneRepMax, oneRepMaxesService, usersService } from '@/services'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Tab = 'profile' | 'equipment' | '1rms'

const EQUIPMENT_CATEGORIES = [
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
      { value: 'rack', label: 'Rack' },
      { value: 'bench', label: 'Banc' },
      { value: 'dumbbell', label: 'Haltères' },
      { value: 'kettlebell', label: 'Kettlebell' },
      { value: 'ez-bar', label: 'Barre EZ' },
      { value: 'trap-bar', label: 'Trap bar' },
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

const EQUIPMENT_PRESETS = [
  { label: 'Minimal', items: ['bodyweight', 'mat'] },
  {
    label: 'Home gym',
    items: ['bodyweight', 'mat', 'band', 'dumbbell', 'kettlebell', 'pull-up-bar', 'jump-rope'],
  },
  {
    label: 'Box CrossFit',
    items: [
      'barbell', 'plates', 'rack', 'dumbbell', 'kettlebell', 'box', 'pull-up-bar',
      'jump-rope', 'rower', 'assault-bike', 'wall-ball', 'rings', 'medicine-ball', 'ghd',
    ],
  },
]

function ProfilePage() {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [fullUser, setFullUser] = useState<User | null>(null)

  // --- Tab Profil ---
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sportLevel, setSportLevel] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [bodyFat, setBodyFat] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState(false)

  // --- Tab Équipement ---
  const [equipment, setEquipment] = useState<string[]>([])
  const [savingEquipment, setSavingEquipment] = useState(false)

  // --- Tab 1RMs ---
  const [oneRepMaxes, setOneRepMaxes] = useState<OneRepMax[]>([])
  const [liftValues, setLiftValues] = useState<Record<string, { value: string; source: 'real' | 'estimated' }>>({})
  const [savingLift, setSavingLift] = useState<string | null>(null)

  // Fetch full profile from /users/me (JWT payload ne contient pas height/weight/etc.)
  useEffect(() => {
    usersService.getUserProfile().then((user) => {
      setFullUser(user)
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setSportLevel(user.sport_level ?? '')
      setHeight(user.height != null ? String(user.height) : '')
      setWeight(user.weight != null ? String(user.weight) : '')
      setBodyFat(user.body_fat_percentage != null ? String(user.body_fat_percentage) : '')
      setEquipment(user.equipment_available ?? [])
    }).catch(() => {
      // Fallback sur le user du contexte si erreur
      if (authUser) {
        setFirstName(authUser.firstName ?? '')
        setLastName(authUser.lastName ?? '')
      }
    })
  }, [authUser])

  // Load 1RMs on mount
  useEffect(() => {
    oneRepMaxesService.getMyOneRepMaxes().then((data) => {
      setOneRepMaxes(data)
      const initial: Record<string, { value: string; source: 'real' | 'estimated' }> = {}
      for (const lift of CROSSFIT_LIFTS) {
        const existing = data.find((r) => r.lift === lift.value)
        initial[lift.value] = {
          value: existing ? String(existing.value) : '',
          source: existing?.source ?? 'real',
        }
      }
      setLiftValues(initial)
    }).catch(() => {
      // Init empty state even on error
      const initial: Record<string, { value: string; source: 'real' | 'estimated' }> = {}
      for (const lift of CROSSFIT_LIFTS) {
        initial[lift.value] = { value: '', source: 'real' }
      }
      setLiftValues(initial)
    })
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await usersService.updateMe({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        sport_level: (sportLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite') || undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        body_fat_percentage: bodyFat ? Number(bodyFat) : undefined,
      })
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveEquipment = async () => {
    try {
      setSavingEquipment(true)
      await usersService.updateMe({ equipment_available: equipment })
      toast.success('Équipement mis à jour')
    } catch {
      toast.error("Erreur lors de la mise à jour de l'équipement")
    } finally {
      setSavingEquipment(false)
    }
  }

  const handleSaveLift = async (liftValue: string) => {
    const entry = liftValues[liftValue]
    if (!entry?.value) {
      toast.error('Veuillez entrer une valeur')
      return
    }
    try {
      setSavingLift(liftValue)
      const result = await oneRepMaxesService.upsertOneRepMax(liftValue, {
        value: Number(entry.value),
        source: entry.source,
      })
      setOneRepMaxes((prev) => {
        const filtered = prev.filter((r) => r.lift !== liftValue)
        return [...filtered, result]
      })
      toast.success('1RM sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde du 1RM')
    } finally {
      setSavingLift(null)
    }
  }

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profil' },
    { key: 'equipment', label: 'Équipement' },
    { key: '1rms', label: '1RMs' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-700/50 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Mon Profil</h1>
            <p className="text-slate-400 text-sm mt-0.5">Gérez vos informations personnelles et préférences</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Profil */}
        {activeTab === 'profile' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
            <h2 className="text-lg font-bold">Informations personnelles</h2>

            {/* Email readonly */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={fullUser?.email ?? authUser?.email ?? ''}
                readOnly
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/30 border border-slate-700/30 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Niveau sportif</label>
              <select
                value={sportLevel}
                onChange={(e) => setSportLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              >
                <option value="">Non renseigné</option>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Taille (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="180"
                  min="100"
                  max="250"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Poids (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75"
                  min="30"
                  max="300"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">% Graisse</label>
                <input
                  type="number"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="15"
                  min="3"
                  max="60"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {savingProfile ? 'Sauvegarde...' : 'Sauvegarder le profil'}
            </button>
          </div>
        )}

        {/* Tab Équipement */}
        {activeTab === 'equipment' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold">Équipement disponible</h2>
              <p className="text-sm text-slate-400 mt-1">
                Renseignez l'équipement dont vous disposez pour que l'IA génère des workouts adaptés.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_PRESETS.map((preset) => (
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

            {/* Equipment grid */}
            <div className="space-y-3 rounded-xl p-3 bg-slate-900/50 border border-slate-700/50">
              {EQUIPMENT_CATEGORIES.map((group) => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => {
                      const isSelected = equipment.includes(item.value)
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => toggleEquipment(item.value)}
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

            {equipment.length > 0 && (
              <p className="text-xs text-orange-400 font-medium">
                {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
              </p>
            )}

            <button
              onClick={handleSaveEquipment}
              disabled={savingEquipment}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {savingEquipment ? 'Sauvegarde...' : "Sauvegarder l'équipement"}
            </button>
          </div>
        )}

        {/* Tab 1RMs */}
        {activeTab === '1rms' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold">Mes 1 Rep Max</h2>
              <p className="text-sm text-slate-400 mt-1">
                Renseignez vos maximums pour que l'IA calibre les charges en conséquence.
              </p>
            </div>

            <div className="space-y-3">
              {CROSSFIT_LIFTS.map((lift) => {
                const entry = liftValues[lift.value] ?? { value: '', source: 'real' as const }
                const existing = oneRepMaxes.find((r) => r.lift === lift.value)
                const isSaving = savingLift === lift.value

                return (
                  <div
                    key={lift.value}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{lift.label}</p>
                      {existing && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Dernier : {existing.value} kg · {existing.source === 'real' ? 'Réel' : 'Estimé'}
                        </p>
                      )}
                    </div>

                    {/* Source toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-slate-700/50 text-xs font-medium flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setLiftValues((prev) => ({
                            ...prev,
                            [lift.value]: { ...entry, source: 'real' },
                          }))
                        }
                        className={`px-2.5 py-1.5 transition-colors ${
                          entry.source === 'real'
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Réel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLiftValues((prev) => ({
                            ...prev,
                            [lift.value]: { ...entry, source: 'estimated' },
                          }))
                        }
                        className={`px-2.5 py-1.5 transition-colors ${
                          entry.source === 'estimated'
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Estimé
                      </button>
                    </div>

                    {/* kg input */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        value={entry.value}
                        onChange={(e) =>
                          setLiftValues((prev) => ({
                            ...prev,
                            [lift.value]: { ...entry, value: e.target.value },
                          }))
                        }
                        placeholder="kg"
                        min="0"
                        step="0.5"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                      />
                      <span className="text-xs text-slate-500">kg</span>
                    </div>

                    {/* Save button */}
                    <button
                      type="button"
                      onClick={() => handleSaveLift(lift.value)}
                      disabled={isSaving || !entry.value}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all shadow-sm shadow-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isSaving ? '...' : 'OK'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePageWrapper() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  )
}
