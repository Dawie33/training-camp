import { SkillProgress, SkillProgressResult } from '../types/analytics.types'

export interface SkillProgramRow {
  program_id: string
  skill_name: string
  skill_category: string
}

export interface SkillStepRow {
  program_id: string
  title: string
  status: string
}

/** Étapes qui comptent comme franchies dans le calcul d'avancement. */
const DONE_STATUSES = new Set(['completed', 'skipped'])

/**
 * Avancement des programmes de compétence actifs.
 *
 * Une étape sautée compte comme franchie : l'athlète a dépassé le palier, même
 * sans l'avoir validé formellement, et le bloquer fausserait la progression.
 *
 * @param programs Programmes actifs de l'utilisateur
 * @param steps Étapes de ces programmes, tous programmes confondus
 * @returns Les programmes avec leur avancement, du plus avancé au moins avancé
 */
export function computeSkillProgress(programs: SkillProgramRow[], steps: SkillStepRow[]): SkillProgressResult {
  if (programs.length === 0) return { available: false, skills: [] }

  const stepsByProgram = new Map<string, SkillStepRow[]>()
  for (const step of steps) {
    const bucket = stepsByProgram.get(step.program_id)
    if (bucket) bucket.push(step)
    else stepsByProgram.set(step.program_id, [step])
  }

  const skills: SkillProgress[] = programs.map(program => {
    const programSteps = stepsByProgram.get(program.program_id) ?? []
    const total = programSteps.length
    const done = programSteps.filter(step => DONE_STATUSES.has(step.status)).length
    const current = programSteps.find(step => step.status === 'in_progress')

    return {
      program_id: program.program_id,
      skill_name: program.skill_name,
      skill_category: program.skill_category,
      current_step_title: current?.title ?? null,
      completed_steps: done,
      total_steps: total,
      progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  })

  skills.sort((a, b) => b.progress_pct - a.progress_pct || a.skill_name.localeCompare(b.skill_name))

  return { available: true, skills }
}
