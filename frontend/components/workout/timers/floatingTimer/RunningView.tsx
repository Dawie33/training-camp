'use client'

import { motion } from 'framer-motion'
import { Minimize2, X } from 'lucide-react'
import { ReactNode } from 'react'

interface RunningViewProps {
    children: ReactNode
    onClose: () => void
    onMinimize: () => void
}

export function RunningView({ children, onClose, onMinimize }: RunningViewProps) {
    return (
        <motion.div
            className="bg-background border border-border rounded-2xl shadow-2xl p-4 w-80"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {/* Header with minimize and close buttons */}
            <div className="flex items-center justify-end gap-1 mb-2">
                <motion.button
                    onClick={onMinimize}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Réduire"
                >
                    <Minimize2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                    onClick={onClose}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Fermer"
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Timer content */}
            <div className="w-full">
                {children}
            </div>
        </motion.div>
    )
}
