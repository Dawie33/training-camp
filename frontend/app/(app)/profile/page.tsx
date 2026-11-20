'use client'

import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { useState } from 'react'
import type { UpdateUserDTO } from '@/domain/entities/auth'
import { EquipmentTab } from './_components/EquipmentTab'
import { InjuriesTab } from './_components/InjuriesTab'
import { ProfileTab } from './_components/ProfileTab'
import { AthleteTab } from './_components/AthleteTab'
import { useInjuries } from './_hooks/useInjuries'
import { useProfileForm } from './_hooks/useProfileForm'

type Tab = 'profile' | 'athlete' | 'equipment' | 'injuries'

const tabs: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profil' },
  { key: 'athlete', label: 'Sport' },
  { key: 'equipment', label: 'Équipement' },
  { key: 'injuries', label: 'Blessures' },
]

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [athleteChanges, setAthleteChanges] = useState<UpdateUserDTO>({})
  const [athleteLimitations, setAthleteLimitations] = useState<string | null>(null)
  const [savingAthlete, setSavingAthlete] = useState(false)
  const {
    fullUser, setFullUser, authUser,
    firstName, setFirstName,
    lastName, setLastName,
    sportLevel, setSportLevel,
    height, setHeight,
    weight, setWeight,
    bodyFat, setBodyFat,
    maxHeartRate, setMaxHeartRate,
    savingProfile, handleSaveProfile,
    equipment, savingEquipment, toggleEquipment, setEquipment, handleSaveEquipment,
  } = useProfileForm()
  const injuries = useInjuries(fullUser)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="border-b-2 border-foreground pb-6">
        <div className="eyebrow mb-3">Compte · préférences personnelles</div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground text-sm mt-3">Gérez vos informations personnelles et préférences</p>
      </header>

      <div>
        {/* Tab bar */}
        <nav aria-label="Sections du profil" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {tabs.map((tab) => (
            <Button variant="ghost"
              key={tab.key}
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border font-display font-semibold ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>

        {activeTab === 'profile' && (
          <ProfileTab
            fullUser={fullUser}
            authEmail={authUser?.email}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            sportLevel={sportLevel} setSportLevel={setSportLevel}
            height={height} setHeight={setHeight}
            weight={weight} setWeight={setWeight}
            bodyFat={bodyFat} setBodyFat={setBodyFat}
            maxHeartRate={maxHeartRate} setMaxHeartRate={setMaxHeartRate}
            saving={savingProfile}
            onSave={handleSaveProfile}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentTab
            equipment={equipment}
            saving={savingEquipment}
            onToggle={toggleEquipment}
            onPreset={setEquipment}
            onClear={() => setEquipment([])}
            onSave={handleSaveEquipment}
          />
        )}

        {activeTab === 'athlete' && (
          fullUser
            ? <AthleteTab
                user={fullUser}
                changes={athleteChanges}
                setChanges={setAthleteChanges}
                limitationsDraft={athleteLimitations}
                setLimitationsDraft={setAthleteLimitations}
                saving={savingAthlete}
                setSaving={setSavingAthlete}
                onSaved={saved => setFullUser(previous => ({ ...previous, ...saved }))}
              />
            : <p role="status" className="text-muted-foreground">Le profil sportif sera disponible après le chargement du profil.</p>
        )}

        {activeTab === 'injuries' && (
          <InjuriesTab
            injuries={injuries.injuries}
            editing={injuries.editing}
            saving={injuries.saving}
            onAdd={injuries.startAdd}
            onEdit={injuries.startEdit}
            onCancel={injuries.cancelEdit}
            onSave={injuries.saveInjury}
            onDelete={injuries.deleteInjury}
          />
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
