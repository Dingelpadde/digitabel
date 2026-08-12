// Node.js runtime — kjøres daglig av Vercel Cron (se vercel.json).
// Sjekker dagens dato (Europe/Oslo) mot DIGEST_SCHEDULE, og sender i så
// fall en kort AI-generert statusoppdatering til faglæreren selv.
//
// VIKTIG: denne mailen går KUN til TEACHER_EMAIL/EMAIL_REPLY_TO, aldri til
// studenter. Mottakeren er hardkodet lenger ned og bygges aldri av
// studentdata, uansett hva som står i databasen.
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { ASSIGNMENTS } from '../src/data/assignments.js'
import { DIGEST_SCHEDULE } from '../src/data/digestSchedule.js'

function todayInOslo() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

function wrapDigestHtml(assignmentTitle, bodyText) {
  const paragraphs = bodyText
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p>${line}</p>`)
    .join('\n')
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2d3d; line-height: 1.6;">
  <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #7e6090;">Statusoppdatering · ${assignmentTitle}</p>
  ${paragraphs}
</div>`
}

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET
  const provided = (req.headers.authorization || '').replace('Bearer ', '')
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: 'Uautorisert' })
  }

  const dryRun = req.query?.dryRun === 'true'
  const today = (dryRun && req.query?.today) || todayInOslo()
  const entry = DIGEST_SCHEDULE.find((d) => d.date === today)

  if (!entry) {
    return res.status(200).json({ matched: false, today, dryRun })
  }

  const assignment = ASSIGNMENTS.find((a) => a.id === entry.assignmentId)
  if (!assignment) {
    return res.status(500).json({ error: `Ukjent assignmentId: ${entry.assignmentId}` })
  }

  if (!process.env.ANTHROPIC_API_KEY || !process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY eller RESEND_API_KEY er ikke satt opp' })
  }

  const emailType = `digest:${entry.assignmentId}:${entry.date}`

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  if (!dryRun) {
    const { data: alreadySent } = await supabase
      .from('email_log')
      .select('id')
      .eq('email_type', emailType)
      .maybeSingle()
    if (alreadySent) {
      return res.status(200).json({ matched: true, today, alreadySent: true })
    }
  }

  const { data: students, error: studentsError } = await supabase.from('students').select('id')
  if (studentsError) {
    console.error('Supabase-feil (students):', studentsError)
    return res.status(500).json({ error: 'Klarte ikke hente studenter' })
  }

  const { data: progress, error: progressError } = await supabase
    .from('student_assignments')
    .select('status, synopsis, students(name)')
    .eq('assignment_id', entry.assignmentId)
  if (progressError) {
    console.error('Supabase-feil (student_assignments):', progressError)
    return res.status(500).json({ error: 'Klarte ikke hente fremdrift' })
  }

  const cleared = progress.filter((p) => p.status === 'cleared')
  const inProgress = progress.filter((p) => p.status === 'in_progress')
  const notStarted = students.length - progress.length

  const synopsisText = cleared
    .filter((c) => c.synopsis)
    .map((c) => `${c.students?.name || 'Ukjent student'}: ${c.synopsis}`)
    .join('\n\n')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `Du er Digitabel. Skriv en kort statusoppdatering til faglærer Abel om temaoppgaven "${assignment.title}", basert på synopsene under.

Struktur, kort og direkte, norsk bokmål, ingen emojier, ingen overskrifter eller punktlister:
1. Tallene: hvor mange er cleared, hvor mange pågår, hvor mange har ikke startet.
2. Om noe i synopsene peker seg ut som bekymringsverdig eller trenger oppfølging, si det rett ut. Hvis ikke, si at ingenting spesielt peker seg ut.
3. Hvem virker mest i gang eller har kommet lengst, basert på synopsene.

Ikke finn på informasjon som ikke står i synopsene. Hvis det ikke finnes noen synopser ennå, si det rett ut i stedet.
Bruk aldri tankestrek (– eller —). Bruk komma, punktum eller linjeskift i stedet.`

  const userContent = `Status for "${assignment.title}":
Cleared: ${cleared.length}
Pågår: ${inProgress.length}
Ikke startet: ${notStarted}

Synopser:
${synopsisText || '(ingen synopser ennå)'}`

  let digestText
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })
    digestText = response.content[0].text.trim()
  } catch (err) {
    console.error('Digest-generering feilet:', err.message)
    return res.status(500).json({ error: err.message })
  }

  if (dryRun) {
    return res.status(200).json({
      matched: true,
      dryRun: true,
      today,
      assignmentId: entry.assignmentId,
      counts: { cleared: cleared.length, inProgress: inProgress.length, notStarted },
      preview: digestText,
    })
  }

  // ─── Mottaker er ALLTID læreren, aldri en student ──────────────────────
  const teacherEmail = process.env.TEACHER_EMAIL || process.env.EMAIL_REPLY_TO
  if (!teacherEmail) {
    return res.status(500).json({ error: 'Ingen TEACHER_EMAIL/EMAIL_REPLY_TO konfigurert' })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Digitabel <onboarding@resend.dev>'

  try {
    await resend.emails.send({
      from,
      to: teacherEmail,
      subject: `Statusoppdatering: ${assignment.title}`,
      html: wrapDigestHtml(assignment.title, digestText),
    })
    await supabase.from('email_log').insert({ student_id: null, email_type: emailType })
  } catch (err) {
    console.error('Digest-sending feilet:', err.message)
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({
    matched: true,
    today,
    assignmentId: entry.assignmentId,
    sentTo: teacherEmail,
  })
}
