/**
 * Datoer for de automatiske statusoppdateringene til faglærer (kun til Abel,
 * aldri til studenter, se api/send-teacher-digest.js).
 *
 * tema-1 og tema-2: 2 dager før veiledning.
 * tema-3: har ingen veiledning, sendes i stedet 1 uke etter mail 4
 * (se SCHEDULED_REMINDERS i emailContent.js), for å sjekke om studentene
 * faktisk bruker Digitabel på det temaet.
 */
export const DIGEST_SCHEDULE = [
  { date: '2026-09-07', assignmentId: 'tema-1-bildeserie' },
  { date: '2026-10-20', assignmentId: 'tema-2-film' },
  { date: '2026-11-17', assignmentId: 'tema-3-historiefortelling' },
]
