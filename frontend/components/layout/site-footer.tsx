'use client'

import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'
import Link from 'next/link'

export default function SiteFooter() {
    const currentYear = new Date().getFullYear()

    const footerLinks = {
        product: [
            { label: 'Workouts', href: '/explore' },
            { label: 'Plans', href: '/plans' },
            { label: 'My Workouts', href: '/personalized-workout' },
        ],
        company: [
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
            { label: 'Blog', href: '/blog' },
        ],
        legal: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Cookies', href: '/cookies' },
        ],
    }



    return (
        <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Logo et description */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Dumbbell className="h-6 w-6 text-primary" />
                            </motion.div>
                            <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                                TRAINING CAMP
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Votre plateforme d'entraînement complète pour atteindre vos objectifs sportifs.
                            Workouts personnalisés, plans d'entraînement et suivi de progression.
                        </p>

                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-sm mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-sm mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-sm mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {currentYear} Training Camp. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Built with ❤️ by the Training Camp team
                    </p>
                </div>
            </div>
        </footer>
    )
}
