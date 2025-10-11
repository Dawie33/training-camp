'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteUser, getUsers } from '@/lib/api/admin'
import { Edit, Search, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [total, setTotal] = useState(0)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers({ limit: 100, search, role: role || undefined })
      setUsers(data.rows)
      setTotal(data.count)
    } catch (error) {
      console.error('Failed to load users', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search, role])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return

    try {
      await deleteUser(id)
      toast.success('User deleted')
      loadUsers()
    } catch (error) {
      console.error('Failed to delete user', error)
      toast.error('Failed to delete user')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Users
          </h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-3 py-2 border border-input bg-background rounded-md"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="coach">Coach</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <div>Email: {user.email}</div>
                      <div className="flex gap-4 flex-wrap">
                        <span>Role: {user.role || 'user'}</span>
                        <span>Status: {user.is_active ? 'Active' : 'Inactive'}</span>
                        {user.workouts_count > 0 && (
                          <span>Workouts: {user.workouts_count}</span>
                        )}
                      </div>
                      <div className="text-xs">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
