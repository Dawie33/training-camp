'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createExercise } from '@/lib/api/exercices'
import { ExerciseCategory, ExerciseDifficulty, MeasurementType } from '@/lib/types/exercice'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ExerciseCreatePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        instructions: '',
        category: 'strength' as ExerciseCategory,
        difficulty: 'intermediate' as ExerciseDifficulty,
        measurement_type: 'reps' as MeasurementType,
        bodyweight_only: false,
        isActive: true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await createExercise(formData)
            toast.success('Exercise created')
            router.push('/exercises')
        } catch (error) {
            console.error('Failed to create exercise', error)
            toast.error('Failed to create exercise')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Exercise</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Instructions</label>
                            <Textarea
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                rows={5}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Category *</label>
                                <select
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExerciseCategory })}
                                    required
                                >
                                    <option value="strength">Strength</option>
                                    <option value="cardio">Cardio</option>
                                    <option value="gymnastics">Gymnastics</option>
                                    <option value="olympic_lifting">Olympic Lifting</option>
                                    <option value="powerlifting">Powerlifting</option>
                                    <option value="endurance">Endurance</option>
                                    <option value="mobility">Mobility</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Difficulty *</label>
                                <select
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as ExerciseDifficulty })}
                                    required
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Measurement Type *</label>
                                <select
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                    value={formData.measurement_type}
                                    onChange={(e) => setFormData({ ...formData, measurement_type: e.target.value as MeasurementType })}
                                    required
                                >
                                    <option value="reps">Reps</option>
                                    <option value="time">Time</option>
                                    <option value="distance">Distance</option>
                                    <option value="weight">Weight</option>
                                    <option value="calories">Calories</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="bodyweight_only"
                                    checked={formData.bodyweight_only}
                                    onChange={(e) => setFormData({ ...formData, bodyweight_only: e.target.checked })}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="bodyweight_only" className="text-sm font-medium">
                                    Bodyweight Only
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">
                                Active
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Création...' : 'Créer'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Annuler
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
