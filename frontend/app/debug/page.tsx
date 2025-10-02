'use client'

import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { useState } from 'react'

type userProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  primary_sport: string
  sports_practiced: string[]
  overall_level: string
  height: string
  weight: string
  resting_heart_rate: string
  max_heart_rate: string
  body_fat_percentage: string
  global_goals: object
  injuries: string[]
  medical_notes: string
  physical_limitations: string[]
  equipment_available: string[]
  training_location: string
  training_preferences: object
  schedule_preferences: object
  isActive: boolean
  emailVerified: boolean
  lastLoginAt: string
  has_coach: boolean
  coach_id: string
  premium_member: boolean
}
export default function DebugPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [profileData, setProfileData] = useState<userProfile>({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    primary_sport: '',
    sports_practiced: [],
    overall_level: '',
    height: '',
    weight: '',
    resting_heart_rate: '',
    max_heart_rate: '',
    body_fat_percentage: '',
    global_goals: {},
    injuries: [],
    medical_notes: '',
    physical_limitations: [],
    equipment_available: [],
    training_location: '',
    training_preferences: {},
    schedule_preferences: {},
    isActive: false,
    emailVerified: false,
    lastLoginAt: '',
    has_coach: false,
    coach_id: '',
    premium_member: false,
  })

  const checkToken = () => {
    const token = localStorage.getItem('access_token')
    alert(token ? `Token: ${token.substring(0, 50)}...` : 'Pas de token')
  }

  const fetchProfile = async () => {
    try {
      const response: userProfile = await apiClient.get('/api/auth/profile')
      setProfileData(response)
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur: ' + error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Auth</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold text-xl mb-2">État Auth Context</h2>
          <p>Loading: {loading ? '✅' : '❌'}</p>
          <p>isAuthenticated: {isAuthenticated ? '✅' : '❌'}</p>
          <p>User: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold text-xl mb-2">Actions</h2>
          <div className="flex gap-2">
            <button
              onClick={checkToken}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Vérifier Token
            </button>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Fetch Profile
            </button>
          </div>
        </div>

        {profileData && (
          <div className="border p-4 rounded">
            <h2 className="font-semibold text-xl mb-2">Profile Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
