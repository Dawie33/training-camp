'use client'

import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Award, Sparkles, TrendingUp } from 'lucide-react'

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
        <Award className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucun record personnel</p>
        <p className="text-xs mt-1">Continue à t'entraîner pour établir tes premiers records !</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Aujourd'hui"
    }
    if (diffDays === 1) {
      return 'Hier'
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    }
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
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{record.type}</h4>
                    {recent && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Nouveau
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {record.value}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">{record.unit}</p>
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        )
      })}

      {/* Summary */}
      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: records.length * 0.05 }}
          className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Total des records</span>
            </div>
            <span className="font-bold">{records.length}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
