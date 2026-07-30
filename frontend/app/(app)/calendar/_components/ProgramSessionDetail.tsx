type StrengthMovement = {
  name: string
  sets?: number
  reps?: number | string
  intensity?: string | null
  rest?: string | null
  notes?: string | null
}

type ConditioningMovement = {
  name: string
  reps?: number | string | null
  distance?: string | null
  weight?: string | null
  calories?: number | null
  time?: string | null
}

type Conditioning = {
  type?: string
  duration_minutes?: number | null
  rounds?: number | null
  movements?: ConditioningMovement[]
  score_type?: string | null
  scaling_notes?: string | null
}

type SkillWork = {
  name: string
  description?: string
  sets?: number | null
  duration?: string | null
  notes?: string | null
}

export type ProgramSessionData = {
  title?: string
  focus?: string
  estimated_duration?: number
  strength_work?: { movements?: StrengthMovement[] } | null
  conditioning?: Conditioning | null
  skill_work?: SkillWork | null
  coach_notes?: string | null
}

const CONDITIONING_LABELS: Record<string, string> = {
  amrap: 'AMRAP',
  for_time: 'For Time',
  emom: 'EMOM',
  tabata: 'Tabata',
  rounds_for_time: 'Rounds For Time',
  death_by: 'Death By',
  chipper: 'Chipper',
}

function conditioningHeadline(c: Conditioning): string {
  const type = c.type ? CONDITIONING_LABELS[c.type] ?? c.type.replace(/_/g, ' ') : ''
  const parts: string[] = []
  if (c.rounds) parts.push(`${c.rounds} rounds`)
  if (c.duration_minutes) parts.push(`${c.duration_minutes} min`)
  return [type, parts.join(' · ')].filter(Boolean).join(' — ')
}

function conditioningQty(m: ConditioningMovement): string {
  if (m.calories) return `${m.calories} cal`
  if (m.reps != null && m.reps !== '') return String(m.reps)
  if (m.distance) return m.distance
  if (m.time) return m.time
  return ''
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="eyebrow text-primary mb-2">{label}</p>
      {children}
    </div>
  )
}

/**
 * Rendu du contenu d'une séance de programme (session_data) en style Clay,
 * pour affichage inline dans le détail d'un événement du calendrier.
 */
export function ProgramSessionDetail({ session }: { session: ProgramSessionData }) {
  const strength = session.strength_work?.movements ?? []
  const conditioning = session.conditioning
  const skill = session.skill_work
  const hasContent =
    strength.length > 0 ||
    (conditioning && (conditioning.movements?.length ?? 0) > 0) ||
    !!skill ||
    !!session.coach_notes

  if (!hasContent) return null

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 divide-y divide-border">
      {strength.length > 0 && (
        <Section label="Force">
          <ul className="space-y-1.5">
            {strength.map((m, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 font-medium text-foreground tabular-nums">
                    {m.sets ?? '—'} × {m.reps ?? '—'}
                  </span>
                  <span className="text-foreground">{m.name}</span>
                  {m.intensity && <span className="text-xs text-primary">{m.intensity}</span>}
                </div>
                {(m.rest || m.notes) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[m.rest ? `Repos ${m.rest}` : null, m.notes].filter(Boolean).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {conditioning && (conditioning.movements?.length ?? 0) > 0 && (
        <Section label="Conditioning">
          {conditioningHeadline(conditioning) && (
            <p className="text-sm font-medium text-foreground mb-1.5">{conditioningHeadline(conditioning)}</p>
          )}
          <ul className="space-y-1">
            {conditioning.movements!.map((m, i) => {
              const qty = conditioningQty(m)
              return (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  {qty && <span className="shrink-0 w-16 text-right text-muted-foreground tabular-nums">{qty}</span>}
                  <span className="text-foreground">{m.name}</span>
                  {m.weight && <span className="text-xs text-muted-foreground">@ {m.weight}</span>}
                </li>
              )
            })}
          </ul>
          {conditioning.scaling_notes && (
            <p className="text-xs text-muted-foreground mt-2">{conditioning.scaling_notes}</p>
          )}
        </Section>
      )}

      {skill && (
        <Section label="Skill">
          <p className="text-sm font-medium text-foreground">{skill.name}</p>
          {skill.description && <p className="text-sm text-muted-foreground mt-0.5">{skill.description}</p>}
          {(skill.sets || skill.duration || skill.notes) && (
            <p className="text-xs text-muted-foreground mt-1">
              {[skill.sets ? `${skill.sets} séries` : null, skill.duration, skill.notes].filter(Boolean).join(' · ')}
            </p>
          )}
        </Section>
      )}

      {session.coach_notes && (
        <Section label="Notes du coach">
          <p className="text-sm text-muted-foreground italic">{session.coach_notes}</p>
        </Section>
      )}
    </div>
  )
}
