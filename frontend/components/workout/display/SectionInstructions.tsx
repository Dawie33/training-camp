interface SectionInstructionsProps {
  rounds?: number
  rest_between_rounds?: number
  between_rounds_task?: string
}

export function SectionInstructions({ rounds, rest_between_rounds, between_rounds_task }: SectionInstructionsProps) {
  if (!rounds && !rest_between_rounds && !between_rounds_task) return null

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2 text-xs">
      <div className="font-medium text-amber-800 mb-0.5">Instructions</div>
      <div className="text-amber-700">
        {rounds === 1 ? (
          <>Réalise 1 tour complet des exercices ci-dessous</>
        ) : rounds ? (
          <>Répète {rounds} fois la série d'exercices ci-dessous</>
        ) : null}
        {rest_between_rounds && rounds && rounds > 1 && <> avec {rest_between_rounds}s de repos entre chaque tour</>}.
        {between_rounds_task && <> Après chaque tour : {between_rounds_task}.</>}
      </div>
    </div>
  )
}
