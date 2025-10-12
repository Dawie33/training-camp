import Link from 'next/link'

/**
* Composant affichant un appel à l'action pour découvrir les plans.
 */
export function PlanSelection() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image avec gradient du sport */}
            <div className="relative h-64 md:h-auto">
                <div className="absolute inset-0" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80)' }}
                />
            </div>

            {/* Contenu */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-4">Besoin d&apos;un plan ?</h2>
                <p className="text-muted-foreground mb-6">
                    Choisis le programme optimal qui combine force, cardio et équilibre mental pour atteindre tes objectifs.
                </p>
                <Link
                    href="/plans"
                    className="inline-block px-6 py-3 rounded-full font-semibold transition-all w-fit"
                >
                    Découvrir les plans
                </Link>
            </div>
        </div>
    )
}