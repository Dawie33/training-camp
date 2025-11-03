'use client'

import { motion } from 'framer-motion'
import { GripVertical, Minimize2, X } from 'lucide-react'

interface ExpandedViewProps {
    children: React.ReactNode
    onMinimize: () => void
    onClose: () => void
}

/**
* Un composant qui affiche une vue agrandie d'un chronomètre d'entraînement.
* Il possède un en-tête déplaçable avec des boutons de réduction et de fermeture.
* Le contenu du chronomètre est affiché sous l'en-tête.
* Le composant accepte trois propriétés: children, onMinimize et onClose.
* children correspond au contenu du chronomètre à afficher.
* onMinimize est une fonction appelée lorsque l'utilisateur clique sur le bouton de réduction.
* onClose est une fonction appelée lorsque l'utilisateur clique sur le bouton de fermeture.
 */
export function ExpandedView({ children, onMinimize, onClose }: ExpandedViewProps) {
    return (
        <div className="bg-background/95 backdrop-blur border border-border rounded-2xl shadow-2xl w-[320px]">
            {/* Header draggable */}
            <div className="flex items-center justify-between p-3 border-b border-border cursor-move">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs font-semibold">WORKOUT TIMER</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={onMinimize}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Minimize2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        onClick={onClose}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-red-500"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Contenu du timer */}
            <div className="p-4">
                {children}
            </div>
        </div>
    )
}