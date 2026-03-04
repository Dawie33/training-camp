'use client'

import type { ProgramPhase, ProgramSession } from '@/domain/entities/training-program'
import { FOCUS_COLORS, FOCUS_LABELS, LEVEL_LABELS, PROGRAM_TYPE_LABELS } from '@/domain/entities/training-program'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Save, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useProgramGenerator } from '../_hooks/useProgramGenerator'

function NewProgramContent() {
  const { step, setStep, formData, updateField, generating, saving, generatedProgram, handleGenerate, handleSave } =
    useProgramGenerator()

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link
            href="/training-programs"
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {step === 1 ? 'Créer un programme' : 'Aperçu du programme'}
            </h1>
            <p className="text-sm text-slate-400">
              {step === 1 ? "L'IA va générer un programme adapté à votre profil" : 'Vérifiez et sauvegardez'}
            </p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <motion.div variants={fadeInUp} className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  step >= s ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 ${step > s ? 'bg-orange-500' : 'bg-white/10'}`} />}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">{step === 1 ? 'Paramètres' : 'Aperçu'}</span>
        </motion.div>

        {step === 1 ? (
          /* STEP 1 : Formulaire */
          <motion.div variants={fadeInUp} className="space-y-5">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5">
              {/* Type de programme */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Type de programme</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateField('program_type', key)}
                      className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        formData.program_type === key
                          ? 'border-orange-500/60 bg-orange-500/15 text-orange-400 font-medium'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Niveau */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Niveau</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateField('target_level', key)}
                      className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        formData.target_level === key
                          ? 'border-orange-500/60 bg-orange-500/15 text-orange-400 font-medium'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Durée</label>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 6, 8, 12].map((w) => (
                    <button
                      key={w}
                      onClick={() => updateField('duration_weeks', w)}
                      className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        formData.duration_weeks === w
                          ? 'border-orange-500/60 bg-orange-500/15 text-orange-400 font-medium'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {w} sem.
                    </button>
                  ))}
                </div>
              </div>

              {/* Séances / semaine */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Séances par semaine</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateField('sessions_per_week', n)}
                      className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        formData.sessions_per_week === n
                          ? 'border-orange-500/60 bg-orange-500/15 text-orange-400 font-medium'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {n} séances
                    </button>
                  ))}
                </div>
              </div>

              {/* Jours box */}
              <div>
                <label className="text-sm font-medium text-white mb-1 block">
                  Jours en box CrossFit par semaine
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Ces jours ne seront pas utilisés par le programme
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateField('box_days_per_week', n)}
                      className={`py-2.5 rounded-xl border text-sm transition-all ${
                        formData.box_days_per_week === n
                          ? 'border-violet-500/60 bg-violet-500/15 text-violet-400 font-medium'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus optionnel */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Focus particulier <span className="text-slate-500 font-normal">(optionnel)</span>
                </label>
                <input
                  value={formData.focus ?? ''}
                  onChange={(e) => updateField('focus', e.target.value)}
                  placeholder="ex: olympic lifting, gymnastics, engine..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Générer mon programme
                </>
              )}
            </button>
          </motion.div>
        ) : generatedProgram ? (
          /* STEP 2 : Aperçu */
          <motion.div variants={fadeInUp} className="space-y-5">
            {/* Program meta */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-3">
              <h2 className="text-xl font-bold text-white">{generatedProgram.name}</h2>
              <p className="text-sm text-slate-400">{generatedProgram.description}</p>
              {generatedProgram.objectives && (
                <p className="text-sm text-slate-300 border-l-2 border-orange-500/50 pl-3">
                  {generatedProgram.objectives}
                </p>
              )}
            </div>

            {/* Phases */}
            <div className="space-y-4">
              {generatedProgram.phases.map((phase: ProgramPhase & { sessions: ProgramSession[] }) => (
                <div key={phase.phase_number} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Phase {phase.phase_number}</span>
                      <h3 className="font-semibold text-white">{phase.name}</h3>
                      <span className="text-xs text-slate-500">
                        sem. {Math.min(...phase.weeks)}–{Math.max(...phase.weeks)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{phase.description}</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {phase.sessions.map((session: ProgramSession) => {
                      const focusColor = FOCUS_COLORS[session.focus] ?? FOCUS_COLORS.mixed
                      return (
                        <div key={session.session_in_week} className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">S{session.session_in_week}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${focusColor}`}>
                              {FOCUS_LABELS[session.focus] ?? session.focus}
                            </span>
                            <span className="text-xs text-slate-500">{session.estimated_duration} min</span>
                          </div>
                          <p className="text-sm text-white font-medium">{session.title}</p>
                          {session.strength_work && (
                            <p className="text-xs text-slate-400 mt-1">
                              Force : {session.strength_work.movements.map((m) => m.name).join(', ')}
                            </p>
                          )}
                          {session.conditioning && (
                            <p className="text-xs text-blue-400/70 mt-0.5">
                              {session.conditioning.type.toUpperCase()} ·{' '}
                              {session.conditioning.movements.map((m) => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Progression notes */}
            {generatedProgram.progression_notes && (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Progression</p>
                <p className="text-sm text-slate-300">{generatedProgram.progression_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-60 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lancer le programme
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}

export default function NewProgramPage() {
  return <NewProgramContent />
}
