'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PostWodAnalysisModal } from '@/components/workout/PostWodAnalysisModal'
import { sessionService, type WodAnalysis } from '@/services/sessions'
import { scheduleApi } from '@/services/schedule'
import { toast } from 'sonner'
import { Star, Trophy } from 'lucide-react'

interface LogWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  workoutId: string
  workoutName: string
  workoutType?: string
  onLogged: () => void
}

type ScoreType = 'for_time' | 'amrap' | 'libre'

function detectScoreType(workoutType?: string): ScoreType {
  if (!workoutType) return 'for_time'
  if (workoutType === 'for_time') return 'for_time'
  if (workoutType === 'amrap') return 'amrap'
  if (workoutType === 'emom' || workoutType === 'strength') return 'libre'
  return 'for_time'
}

export function LogWorkoutModal({
  open,
  onOpenChange,
  scheduleId,
  workoutId,
  workoutName,
  workoutType,
  onLogged,
}: LogWorkoutModalProps) {
  const [saving, setSaving] = useState(false)
  const [scoreType, setScoreType] = useState<ScoreType>(() => detectScoreType(workoutType))
  const [mins, setMins] = useState('')
  const [secs, setSecs] = useState('')
  const [capAtteint, setCapAtteint] = useState(false)
  const [capScore, setCapScore] = useState('')
  const [capDescription, setCapDescription] = useState('')
  const [rounds, setRounds] = useState('')
  const [bonusReps, setBonusReps] = useState('')
  const [isRx, setIsRx] = useState(true)
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)

  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysis, setAnalysis] = useState<WodAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setScoreType(detectScoreType(workoutType))
      setMins('')
      setSecs('')
      setCapAtteint(false)
      setCapScore('')
      setCapDescription('')
      setRounds('')
      setBonusReps('')
      setIsRx(true)
      setNotes('')
      setRating(0)
      setAnalysis(null)
    }
  }, [open, workoutType])

  const handleSave = async () => {
    setSaving(true)
    try {
      const session = await sessionService.startSession({
        workout_id: workoutId,
        started_at: new Date().toISOString(),
      })

      const results: Record<string, unknown> = { rx: isRx }
      if (scoreType === 'for_time') {
        if (capAtteint) {
          results.cap_reached = true
          if (capScore) results.reps_at_cap = parseInt(capScore, 10)
          if (capDescription) results.cap_description = capDescription
        } else {
          const totalSecs = (parseInt(mins || '0', 10) * 60) + parseInt(secs || '0', 10)
          if (totalSecs > 0) results.elapsed_time_seconds = totalSecs
        }
      } else if (scoreType === 'amrap') {
        if (rounds) results.rounds = parseInt(rounds, 10)
        if (bonusReps) results.reps = parseInt(bonusReps, 10)
      }
      if (rating > 0) results.rating = rating

      await sessionService.updateSession(session.id, {
        completed_at: new Date().toISOString(),
        notes: notes || undefined,
        results,
      })

      await scheduleApi.markAsCompleted(scheduleId, session.id)

      toast.success('WOD enregistré !')
      onLogged()
      onOpenChange(false)
      handleAnalyze(session.id)
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleAnalyze = async (sessionId: string) => {
    setAnalysisOpen(true)
    setAnalysisLoading(true)
    setAnalysis(null)
    try {
      const result = await sessionService.analyzeSession(sessionId)
      setAnalysis(result)
    } catch {
      toast.error("Impossible de générer l'analyse")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const tabs: { key: ScoreType; label: string }[] = [
    { key: 'for_time', label: 'For Time' },
    { key: 'amrap', label: 'AMRAP' },
    { key: 'libre', label: 'Libre' },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-orange-400" />
              Logger le WOD
            </DialogTitle>
            <p className="text-sm text-slate-400 mt-1 truncate">{workoutName}</p>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Score type tabs */}
            <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setScoreType(tab.key)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    scoreType === tab.key
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Score inputs */}
            {scoreType === 'for_time' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">Temps</label>
                  <button
                    onClick={() => setCapAtteint(!capAtteint)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                      capAtteint
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cap atteint
                  </button>
                </div>
                {!capAtteint ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-white/10 rounded-lg px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={mins}
                        onChange={(e) => setMins(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-white text-center text-lg font-mono outline-none"
                      />
                      <span className="text-slate-400 text-sm">min</span>
                    </div>
                    <span className="text-slate-400 text-lg font-bold">:</span>
                    <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-white/10 rounded-lg px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={secs}
                        onChange={(e) => setSecs(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-white text-center text-lg font-mono outline-none"
                      />
                      <span className="text-slate-400 text-sm">s</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={capScore}
                        onChange={(e) => setCapScore(e.target.value)}
                        placeholder="0"
                        className="w-24 bg-transparent text-white text-center text-lg font-mono outline-none"
                      />
                      <span className="text-red-400 text-sm">reps total (score officiel)</span>
                    </div>
                    <input
                      type="text"
                      value={capDescription}
                      onChange={(e) => setCapDescription(e.target.value)}
                      placeholder="Ex: Round 2 + 24m lunges + 15 chest-to-bar"
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500/50"
                    />
                  </div>
                )}
              </div>
            )}

            {scoreType === 'amrap' && (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Score</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-white/10 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={rounds}
                      onChange={(e) => setRounds(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-white text-center text-lg font-mono outline-none"
                    />
                    <span className="text-slate-400 text-sm">rounds</span>
                  </div>
                  <span className="text-slate-400">+</span>
                  <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-white/10 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={bonusReps}
                      onChange={(e) => setBonusReps(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-white text-center text-lg font-mono outline-none"
                    />
                    <span className="text-slate-400 text-sm">reps</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rx / Scaled toggle */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Performance</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRx(true)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    isRx
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rx
                </button>
                <button
                  onClick={() => setIsRx(false)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    !isRx
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Scaled
                </button>
              </div>
            </div>

            {/* Star rating */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Note (optionnel)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star === rating ? 0 : star)}>
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= rating ? 'text-orange-400 fill-orange-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ressenti, substitutions, PR..."
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostWodAnalysisModal
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        analysis={analysis}
        loading={analysisLoading}
        workoutName={workoutName}
      />
    </>
  )
}
