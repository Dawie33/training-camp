'use client'

import { Sport } from '@/lib/types/sport'
import { getSportImage } from '@/lib/utils/sport-images'
import { Activity, Award, Heart, Target, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SportDetailsProps {
  sport: Sport
  isExpanded?: boolean
}

interface SportBenefit {
  icon: React.ReactNode
  title: string
  description: string
}

/**
 * Composant pour afficher les détails d'un sport avec ses avantages
 * Animation slide-down avec transition fluide
 */
export function SportDetails({ sport, isExpanded = true }: SportDetailsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      // Petit délai pour l'animation
      setTimeout(() => setIsVisible(true), 50)
    } else {
      setIsVisible(false)
    }
  }, [isExpanded])

  // Avantages par sport (vous pouvez enrichir cela avec des données de votre API)
  const getBenefits = (sportSlug: string): SportBenefit[] => {
    const benefitsByType: Record<string, SportBenefit[]> = {
      crossfit: [
        {
          icon: <Zap className="w-5 h-5" />,
          title: "Force fonctionnelle",
          description: "Développe une force applicable au quotidien"
        },
        {
          icon: <Heart className="w-5 h-5" />,
          title: "Cardio intense",
          description: "Améliore l'endurance cardiovasculaire"
        },
        {
          icon: <Target className="w-5 h-5" />,
          title: "Polyvalence",
          description: "Combine force, cardio et mobilité"
        },
        {
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Progression rapide",
          description: "Résultats visibles rapidement"
        }
      ],
      running: [
        {
          icon: <Heart className="w-5 h-5" />,
          title: "Santé cardiovasculaire",
          description: "Renforce le cœur et les poumons"
        },
        {
          icon: <Activity className="w-5 h-5" />,
          title: "Perte de poids",
          description: "Brûle efficacement les calories"
        },
        {
          icon: <Target className="w-5 h-5" />,
          title: "Mental d'acier",
          description: "Améliore la résistance mentale"
        },
        {
          icon: <Award className="w-5 h-5" />,
          title: "Accessible",
          description: "Nécessite peu d'équipement"
        }
      ],
      cycling: [
        {
          icon: <Heart className="w-5 h-5" />,
          title: "Cardio doux",
          description: "Sans impact sur les articulations"
        },
        {
          icon: <Zap className="w-5 h-5" />,
          title: "Puissance des jambes",
          description: "Développe les muscles inférieurs"
        },
        {
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Endurance",
          description: "Augmente la capacité aérobie"
        },
        {
          icon: <Activity className="w-5 h-5" />,
          title: "Calories",
          description: "Brûle beaucoup d'énergie"
        }
      ]
    }

    return benefitsByType[sportSlug] || [
      {
        icon: <Activity className="w-5 h-5" />,
        title: "Améliore la condition physique",
        description: "Développe votre forme générale"
      },
      {
        icon: <Heart className="w-5 h-5" />,
        title: "Santé cardiovasculaire",
        description: "Renforce votre système cardio"
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Atteindre vos objectifs",
        description: "Progressez vers vos buts"
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "Énergie",
        description: "Boostez votre vitalité"
      }
    ]
  }

  const benefits = getBenefits(sport.slug)

  if (!isExpanded) {
    return null
  }

  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-in-out ${isVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
    >
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        {/* Image de fond avec overlay */}
        <div className="relative h-64 md:h-80">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getSportImage(sport.slug, sport.slug)})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />

          {/* Contenu sur l'image */}
          <div className="relative h-full flex flex-col justify-end p-8">
            <div className="flex items-center gap-4 mb-4">
              {sport.icon && <span className="text-6xl">{sport.icon}</span>}
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">{sport.name}</h2>
                <p className="text-lg text-gray-200">{sport.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section des avantages */}
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-6">Pourquoi choisir le sport {sport.name} ?</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Métriques communes */}
          {sport.common_metrics && sport.common_metrics.length > 0 && (
            <div className="mb-8">
              <h4 className="font-semibold mb-3">Métriques suivies</h4>
              <div className="flex flex-wrap gap-2">
                {sport.common_metrics.map((metric, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Équipement requis */}
          {sport.equipment_categories && sport.equipment_categories.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Équipement recommandé</h4>
              <div className="flex flex-wrap gap-2">
                {sport.equipment_categories.map((equipment, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
