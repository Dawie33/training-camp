'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { deleteEquipment, getEquipments } from '@/lib/api/admin'
import { Equipment } from '@/lib/types/equipment'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'


export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEquipments({ limit: 100, search })
      setEquipments(data.rows)
      setTotal(data.count)
    } catch (error) {
      console.error('Failed to load equipments', error)
      toast.error('Erreur lors de la chargement des equipments')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchEquipments()
  }, [fetchEquipments])

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete equipment "${label}"?`)) return

    try {
      await deleteEquipment(id)
      toast.success('Equipment deleted')
      fetchEquipments()
    } catch (error) {
      console.error('Failed to delete equipment', error)
      toast.error('Erreur lors de la suppression de l\'equipment')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipments</h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
        <Link href="/admin/equipments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Equipment
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div >

          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{total}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="w-[200px] text-red-600">Nom</TableHead>
                <TableHead className="w-[200px] text-red-600">Slug</TableHead>
                <TableHead className="w-[200px] text-red-600">Image</TableHead>
                <TableHead className="w-[200px] text-red-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell className="font-medium">{equipment.label}</TableCell>
                  <TableCell className="font-medium">{equipment.slug}</TableCell>
                  <TableCell className="font-medium">{equipment.image_url}</TableCell>
                  <TableCell>    <div className="flex gap-2">
                    <Link href={`/admin/equipments/${equipment.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(equipment.id, equipment.label)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div></TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
