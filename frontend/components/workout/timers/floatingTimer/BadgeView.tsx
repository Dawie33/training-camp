'use client'

import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'

interface BadgeViewProps {
    onClick: () => void
}

export function BadgeView({ onClick }: BadgeViewProps) {
    return (
        <>
            <motion.button
                onClick={onClick}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer "
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <Timer className="w-6 h-6" />
            </motion.button>

        </>
    )
}
