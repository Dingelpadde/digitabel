/**
 * Innholdet i Digitabels automatiske e-poster.
 *
 * WELCOME_EMAIL sendes én gang, når en student registrerer seg (se
 * api/send-welcome.js, trigges fra StudentLogin.jsx).
 *
 * SCHEDULED_REMINDERS sendes automatisk på faste kalenderdatoer via en
 * daglig cron-jobb (se api/send-scheduled-reminders.js + vercel.json).
 * Hver oppføring er koblet til en assignmentId fra assignments.js.
 */

const APP_URL = 'https://digitabel.vercel.app'

function wrap(bodyHtml) {
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2d3d; line-height: 1.6;">
${bodyHtml}
</div>`
}

function button(href, label) {
  return `<p style="text-align: center; margin: 28px 0;">
  <a href="${href}" style="background: #e8b87a; color: #1a0e04; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 4px; display: inline-block;">${label}</a>
</p>`
}

export const WELCOME_EMAIL = {
  subject: 'Velkommen til Digitabel',
  html: (firstName) => wrap(`
  <p>Hei hei, ${firstName}!</p>
  <p>Velkommen til DiP! Mitt navn er Digitabel og jeg skal være din assistent, hjelper og påminner om viktige datoer. Forhåpentligvis vil jeg være med på å gjøre dette studiet enda mer lærerikt. De to hovedfunksjonene mine er å sette opp milepælsplaner for hver temaoppgave og å forberede deg til de forskjellige veiledningene.</p>
  <p>Bare så du vet det, vil jeg sende et kort referat av hvor langt du har kommet på oppgaven og hva jeg anbefalte deg til veileder.</p>
  <p>Gleder meg til å prates i løpet av året!</p>
`),
}

export const SCHEDULED_REMINDERS = [
  {
    date: '2026-09-01',
    assignmentId: 'tema-1-bildeserie',
    subject: 'Snart veiledning, snakk med Digitabel først',
    html: (firstName) => wrap(`
  <p>Tjohei, ${firstName}!</p>
  <p>Nå er det ikke lenge til veiledning og jeg håper du har kommet litt i gang med planlegging for tidenes beste fotoshoot! Jeg er klar til å hjelpe deg, så bare trykk inn på linken så kommer vi i gang!</p>
  ${button(APP_URL, 'Start med Digitabel')}
`),
  },
  {
    date: '2026-10-12',
    assignmentId: 'tema-2-film',
    subject: 'Snart veiledning, snakk med Digitabel først',
    html: (firstName) => wrap(`
  <p>Hola, ${firstName}!</p>
  <p>Tiden for veiledning nærmer seg, og da synes jeg en god prat om preprod med meg hadde vært en god idé. Så trykk deg inn på linken og begynn med plapringen.</p>
  ${button(APP_URL, 'Start med Digitabel')}
`),
  },
  {
    date: '2026-11-10',
    assignmentId: 'tema-3-historiefortelling',
    subject: 'Snart veiledning, snakk med Digitabel først',
    html: (firstName) => wrap(`
  <p>Buongiorno, ${firstName}!</p>
  <p>Nå har vi endelig kommet fram til den viktigste veiledningen. Den med bare meg! Meg! Meg! Så logg deg inn og begynn preikingen!</p>
  ${button(APP_URL, 'Start med Digitabel')}
`),
  },
]
