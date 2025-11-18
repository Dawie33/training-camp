'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createEquipment, getEquipment, updateEquipment } from '@/lib/api/equipments'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function EquipmentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
  })

  useEffect(() => {
    if (!isNew) {
      getEquipment(params.id)
        .then((data) => {
          setFormData({
            label: data.label || '',
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isNew, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isNew) {
        await createEquipment(formData)
        toast.success('Equipment created')
      } else {
        await updateEquipment(params.id, formData)
        toast.success('Equipment updated')
      }
      router.push('/admin/equipments')
    } catch (error) {
      console.error('Failed to save equipment', error)
      toast.error('Failed to save equipment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container mx-auto py-8">Loading...</div>

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
          <CardTitle>{isNew ? 'New Equipment' : 'Edit Equipment'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label *</label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                placeholder="e.g., Barbell, Kettlebell, Pull-up bar"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
