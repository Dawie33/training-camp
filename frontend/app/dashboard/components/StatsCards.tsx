'use client'

import { motion } from 'framer-motion'
import { Activity, Award, Clock, Dumbbell } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative'
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeType, icon }: StatCardProps) {
  return (
    <motion.div
      className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="p-1.5 rounded-lg bg-muted">
              {icon}
            </span>
            <span>{title}</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change && (
              <p className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface StatsCardsProps {
  stats: {
    totalWorkouts: number
    workoutsThisMonth: number
    personalRecords: number
    totalHours: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total workouts"
        value={stats.totalWorkouts}
        change="+16.4%"
        changeType="positive"
        icon={<Dumbbell className="w-4 h-4" />}
      />
      <StatCard
        title="Active ce mois"
        value={stats.workoutsThisMonth}
        change="-4.8%"
        changeType="negative"
        icon={<Activity className="w-4 h-4" />}
      />
      <StatCard
        title="Records personnels"
        value={stats.personalRecords}
        change="+12.8%"
        changeType="positive"
        icon={<Award className="w-4 h-4" />}
      />
      <StatCard
        title="Total heures"
        value={`${stats.totalHours}hrs`}
        change="-1.2%"
        changeType="negative"
        icon={<Clock className="w-4 h-4" />}
      />
    </div>
  )
}
