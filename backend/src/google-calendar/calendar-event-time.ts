import type { calendar_v3 } from 'googleapis'

/** Tous les utilisateurs sont en France : les séances sont placées à l'heure de Paris. */
export const EVENT_TIME_ZONE = 'Europe/Paris'
export const EVENT_START_HOUR = 7
export const DEFAULT_EVENT_DURATION_MINUTES = 60

const pad = (value: number) => String(value).padStart(2, '0')

/** Date-heure « murale », sans fuseau : Google l'interprète dans le timeZone fourni à côté. */
function toLocalDateTime(date: Date): string {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`
  )
}

/**
 * Début et fin de l'événement Google pour une séance planifiée.
 *
 * On envoie une heure locale + `timeZone` plutôt qu'un instant UTC : Google applique lui-même
 * l'heure d'été ou d'hiver. Avec `toISOString()`, 7 h « serveur » (UTC sur Render) donnait 9 h à Paris en été.
 *
 * @param scheduledDate Date de la séance ; seuls les 10 premiers caractères (AAAA-MM-JJ) sont lus,
 * comme le fait PostgreSQL en stockant la colonne `date`.
 */
export function buildEventTimes(
  scheduledDate: string,
  durationMinutes: number = DEFAULT_EVENT_DURATION_MINUTES
): { start: calendar_v3.Schema$EventDateTime; end: calendar_v3.Schema$EventDateTime } {
  const [year, month, day] = scheduledDate.slice(0, 10).split('-').map(Number)
  // Calcul sur une horloge « UTC » utilisée comme horloge murale : aucun fuseau n'intervient
  const start = new Date(Date.UTC(year, month - 1, day, EVENT_START_HOUR, 0))
  const end = new Date(start.getTime() + durationMinutes * 60_000)

  return {
    start: { dateTime: toLocalDateTime(start), timeZone: EVENT_TIME_ZONE },
    end: { dateTime: toLocalDateTime(end), timeZone: EVENT_TIME_ZONE },
  }
}
