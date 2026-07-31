'use client'

import { motion } from 'framer-motion'
import { Medal, TrendingUp, Trophy } from 'lucide-react'

interface PersonalRecord {
  type: string
  value: number
  unit: string
  date: string
}

interface PersonalRecordsProps {
  records: PersonalRecord[]
}

export function PersonalRecords({ records }: PersonalRecordsProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-secondary border border-border flex items-center justify-center">
          <Trophy className="w-5 h-5" />
        </div>
        <p className="text-sm">Aucun record personnel</p>
        <p className="text-xs mt-1 text-muted-foreground">Continue à t'entraîner pour établir tes premiers records !</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `Il y a ${months} mois`
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isRecent = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  return (
    <div className="space-y-3">
      {records.map((record, index) => {
        const recent = isRecent(record.date)

        return (
          <motion.div
            key={`${record.type}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-foreground/25 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Medal className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-semibold">{record.type}</h4>
                    {recent && (
                      <span className="text-xs bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 px-1.5 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-2xl font-semibold text-orange-600">
                    {record.unit.includes(':') ? record.unit : record.value}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">{record.unit.includes(':') ? 'temps' : record.unit}</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </motion.div>
        )
      })}

      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: records.length * 0.05 }}
          className="mt-6 p-4 rounded-lg bg-secondary border border-dashed border-border"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total des records</span>
            </div>
            <span className="font-semibold text-foreground">{records.length}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
