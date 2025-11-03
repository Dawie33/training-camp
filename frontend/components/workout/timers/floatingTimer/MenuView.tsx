'use client'

import { TimerType } from '@/hooks/useWorkoutTimer'
import { motion } from 'framer-motion'
import { Activity, Clock, Dumbbell, X, Zap } from 'lucide-react'

interface MenuViewProps {
    onSelectType: (type: TimerType) => void
    onClose: () => void
}

export function MenuView({ onSelectType, onClose }: MenuViewProps) {
    const timerTypes = [
        {
            type: 'TABATA' as TimerType,
            label: 'Tabata',
            icon: Zap,
            color: 'bg-purple-600 hover:bg-purple-700',
            description: 'Intervalles 20s/10s'
        },
        {
            type: 'AMRAP' as TimerType,
            label: 'AMRAP',
            icon: Activity,
            color: 'bg-orange-400 hover:bg-orange-500',
            description: 'Maximum de rounds'
        },
        {
            type: 'EMOM' as TimerType,
            label: 'EMOM',
            icon: Dumbbell,
            color: 'bg-pink-600 hover:bg-pink-700',
            description: 'Chaque minute'
        },
        {
            type: 'FOR_TIME' as TimerType,
            label: 'For Time',
            icon: Clock,
            color: 'bg-green-600 hover:bg-green-700',
            description: 'Contre la montre'
        },
    ]

    return (
        <motion.div
            className="bg-background border border-border rounded-2xl shadow-2xl p-4 w-80 "
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Choisir un timer</h3>
                <motion.button
                    onClick={onClose}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Timer types */}
            <div className="space-y-2">
                {timerTypes.map((timer, index) => (
                    <motion.button
                        key={timer.type}
                        onClick={() => onSelectType(timer.type)}
                        className={`w-full p-3 rounded-lg ${timer.color} text-white flex items-center gap-3 transition-colors`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <timer.icon className="w-5 h-5" />
                        <div className="flex-1 text-left cursor-pointer">
                            <div className="font-semibold">{timer.label}</div>
                            <div className="text-xs opacity-90">{timer.description}</div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    )
}
