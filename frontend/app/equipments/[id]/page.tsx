'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEquipment, getEquipment, updateEquipment } from '@/services/equipments'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function EquipmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(isNew)
  const [data, setData] = useState({
    label: '',
    description: '',
    image_url: '',
  })
  // Separate state for form to allow cancellation
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    image_url: '',
  })

  useEffect(() => {
    if (!isNew) {
      getEquipment(id)
        .then((equipment) => {
          const initialData = {
            label: equipment.label || '',
            description: equipment.description || '',
            image_url: equipment.image_url || '',
          }
          setData(initialData)
          setFormData(initialData)
        })
        .finally(() => setLoading(false))
    }
  }, [isNew, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isNew) {
        await createEquipment(formData)
        toast.success('Équipement créé')
        router.push('/equipments')
      } else {
        await updateEquipment(id, formData)
        toast.success('Équipement mis à jour')
        setData(formData)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save equipment', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isNew) {
      router.back()
    } else {
      setFormData(data) // Reset form
      setIsEditing(false)
    }
  }

  if (loading) return (
    <div className="container mx-auto py-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        {!isEditing && !isNew && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? 'Nouvel Équipement' : isEditing ? 'Modifier l\'Équipement' : data.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  placeholder="ex: Barre olympique"
                />
              </div>

              <div>
                <label className="text-sm font-medium">URL de l'image</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Aperçu"
                      className="h-32 w-auto object-contain rounded-md border"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'équipement..."
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Enregistrer...' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {data.image_url && (
                <div className="flex justify-center bg-muted/20 rounded-lg p-4">
                  <img
                    src={data.image_url}
                    alt={data.label}
                    className="max-h-[400px] w-auto object-contain rounded-md shadow-sm"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                  {data.description || "Aucune description disponible."}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
