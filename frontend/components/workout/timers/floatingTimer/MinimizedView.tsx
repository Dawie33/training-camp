'use client'

import { motion } from "framer-motion"
import { Maximize2 } from "lucide-react"

/**
* Vue réduite d'un minuteur d'entraînement.
*
* @param {() => void} onClick - Fonction à appeler lorsque le composant est cliqué.
* @param {string} currentTime - Heure actuelle du minuteur d'entraînement.
* @returns {React.ReactElement} Vue réduite du minuteur d'entraînement.
 */
export function MinimizedView({ onClick, currentTime }: { onClick: () => void, currentTime: string }) {
    return (
        <motion.div
            className="cursor-pointer bg-primary text-primary-foreground rounded-full p-4 shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg">{currentTime}</span>
                <Maximize2 className="w-4 h-4" />
            </div>
        </motion.div>
    )
}