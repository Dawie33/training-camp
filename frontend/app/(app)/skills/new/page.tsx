'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Equipment } from '@/domain/entities/equipment'
import type { GeneratedSkillProgram } from '@/domain/entities/skill'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { getEquipments } from '@/services/equipments'
import { skillsService } from '@/services/skills'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Save, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

function NewSkillContent() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedSkillProgram | null>(null)

  // Equipment
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  // Form state
  const [skillName, setSkillName] = useState('')
  const [skillCategory, setSkillCategory] = useState('')
  const [currentCapabilities, setCurrentCapabilities] = useState('')
  const [constraints, setConstraints] = useState('')
  const [userLevel, setUserLevel] = useState('')

  useEffect(() => {
    getEquipments({ limit: 100 }).then(res => setAllEquipments(res.rows)).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!skillName || !skillCategory) {
      toast.error('Veuillez remplir le nom du skill et la categorie')
      return
    }

    try {
      setLoading(true)
      const result = await skillsService.generateWithAI({
        skillName,
        skillCategory,
        currentCapabilities: currentCapabilities || undefined,
        constraints: constraints || undefined,
        userLevel: userLevel || undefined,
        availableEquipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      })
      setGeneratedProgram(result)
      setStep(2)
      toast.success('Programme genere avec succes')
    } catch {
      toast.error('Erreur lors de la generation du programme')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedProgram) return

    try {
      setSaving(true)
      await skillsService.create({
        skill_name: generatedProgram.skill_name,
        skill_category: generatedProgram.skill_category,
        description: generatedProgram.description,
        estimated_weeks: generatedProgram.estimated_weeks,
        progression_notes: generatedProgram.progression_notes,
        safety_notes: generatedProgram.safety_notes,
        ai_parameters: { skillName, skillCategory, currentCapabilities, constraints, userLevel },
        steps: generatedProgram.steps.map(s => ({
          step_number: s.step_number,
          title: s.title,
          description: s.description,
          validation_criteria: s.validation_criteria as unknown as Record<string, unknown> | undefined,
          recommended_exercises: s.recommended_exercises as unknown as Record<string, unknown>[] | undefined,
          coaching_tips: s.coaching_tips,
          estimated_duration_weeks: s.estimated_duration_weeks,
        })),
      })
      toast.success('Programme sauvegarde')
      router.push('/skills')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/skills')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground tracking-tight">Nouveau programme de progression</h1>
          <p className="eyebrow mt-1">Étape {step} sur 2</p>
        </div>
      </motion.div>

      {/* Step indicator */}
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${step === 1 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
          <span className="font-medium">1.</span> Configuration
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${step === 2 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
          <span className="font-medium">2.</span> Aperçu &amp; Sauvegarder
        </div>
      </motion.div>

      {/* Step 1: Form */}
      {step === 1 && (
        <motion.div variants={fadeInUp}>
          <Card className="bg-card border-border p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">Nom du skill *</Label>
              <Input
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="Ex: Muscle-Up, Handstand Walk, Pistol Squat..."
                className="bg-card border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Catégorie *</Label>
              <Select value={skillCategory} onValueChange={setSkillCategory}>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gymnastics">Gymnastique</SelectItem>
                  <SelectItem value="olympic_lifting">Haltérophilie</SelectItem>
                  <SelectItem value="strength">Force</SelectItem>
                  <SelectItem value="mobility">Mobilité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Niveau actuel</Label>
              <Select value={userLevel} onValueChange={setUserLevel}>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Choisir un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Capacités actuelles</Label>
              <Textarea
                value={currentCapabilities}
                onChange={(e) => setCurrentCapabilities(e.target.value)}
                placeholder="Ex: Je peux faire 8 strict pull-ups, je tiens 15s en L-sit..."
                className="bg-card border-border text-foreground min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Equipement disponible</Label>
              <p className="text-xs text-muted-foreground">Sélectionnez l&apos;équipement auquel vous avez accès. L&apos;IA n&apos;utilisera que celui-ci.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {allEquipments.map((eq) => {
                  const isSelected = selectedEquipment.includes(eq.label)
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => {
                        setSelectedEquipment(prev =>
                          isSelected ? prev.filter(e => e !== eq.label) : [...prev, eq.label]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/50 text-primary'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {eq.label}
                    </button>
                  )
                })}
              </div>
              {selectedEquipment.length > 0 && (
                <p className="text-xs text-primary mt-1">{selectedEquipment.length} équipement(s) sélectionné(s)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Contraintes / Limitations</Label>
              <Textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Ex: Douleur épaule gauche, pas d'anneaux disponibles..."
                className="bg-card border-border text-foreground min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !skillName || !skillCategory}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer avec l&apos;IA
                </>
              )}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && generatedProgram && (
        <div className="space-y-6">
          <Card className="bg-card border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">{generatedProgram.skill_name}</h2>
                <p className="text-muted-foreground mt-1">{generatedProgram.description}</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 shrink-0">
                {generatedProgram.estimated_weeks} semaines
              </Badge>
            </div>

            {generatedProgram.safety_notes && (
              <div className="border-l-2 border-primary bg-secondary rounded-r-lg p-4 mb-4">
                <p className="eyebrow text-primary mb-1">Notes de sécurité</p>
                <p className="text-foreground/80 text-sm">{generatedProgram.safety_notes}</p>
              </div>
            )}

            {generatedProgram.progression_notes && (
              <div className="bg-secondary rounded-lg p-4">
                <p className="eyebrow mb-1">Notes de progression</p>
                <p className="text-foreground/80 text-sm">{generatedProgram.progression_notes}</p>
              </div>
            )}
          </Card>

          {/* Steps preview */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Etapes de progression ({generatedProgram.steps.length})</h3>
            {generatedProgram.steps.map((s) => (
              <Card key={s.step_number} className="bg-card border-border p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-display text-primary font-semibold text-sm">{s.step_number}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h4 className="font-semibold text-foreground">{s.title}</h4>
                    <p className="text-muted-foreground text-sm">{s.description}</p>

                    {/* Validation criteria */}
                    {s.validation_criteria && (
                      <div className="bg-secondary rounded-lg p-3">
                        <p className="eyebrow mb-1">Critère de validation</p>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{s.validation_criteria.description}</span>
                        </div>
                      </div>
                    )}

                    {/* Exercises */}
                    {s.recommended_exercises && s.recommended_exercises.length > 0 && (
                      <div>
                        <p className="eyebrow mb-2">Exercices recommandés</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {s.recommended_exercises.map((ex, i) => (
                            <div key={i} className="bg-secondary rounded-lg px-3 py-2">
                              <p className="text-sm text-foreground font-medium">{ex.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[
                                  ex.sets && `${ex.sets} séries`,
                                  ex.reps && `${ex.reps} reps`,
                                  ex.rest && `repos ${ex.rest}`,
                                ].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Programming info */}
                    {(s.frequency || s.when_to_train || s.warmup) && (
                      <div className="border-l-2 border-primary bg-secondary rounded-r-lg p-3 space-y-1">
                        <p className="eyebrow text-primary mb-1">Programmation</p>
                        {s.frequency && (
                          <p className="text-sm text-foreground/80"><span className="font-medium">Fréquence :</span> {s.frequency}</p>
                        )}
                        {s.when_to_train && (
                          <p className="text-sm text-foreground/80"><span className="font-medium">Quand :</span> {s.when_to_train}</p>
                        )}
                        {s.warmup && (
                          <p className="text-sm text-foreground/80"><span className="font-medium">Échauffement :</span> {s.warmup}</p>
                        )}
                      </div>
                    )}

                    {s.coaching_tips && (
                      <p className="text-xs text-muted-foreground italic">{s.coaching_tips}</p>
                    )}

                    {s.estimated_duration_weeks && (
                      <Badge variant="outline" className="text-xs bg-card border-border text-muted-foreground">
                        ~{s.estimated_duration_weeks} semaines
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)} className="border-border text-foreground hover:border-primary hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder le programme
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function NewSkillPage() {
  return     <NewSkillContent />
}
