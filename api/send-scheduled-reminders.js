// Node.js runtime — kjøres daglig av Vercel Cron (se vercel.json).
// Sjekker dagens dato (Europe/Oslo) mot SCHEDULED_REMINDERS og sender
// påminnelsen til studenter som ikke er cleared for temaet ennå.
import { createClient } from '@supabase/supabase-js'
import { SCHEDULED_REMINDERS } from '../src/data/emailContent.js'

function todayInOslo() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date()) // YYYY-MM-DD
}

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET
  const provided = (req.headers.authorization || '').replace('Bearer ', '')
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: 'Uautorisert' })
  }

  // dryRun: beregner mottakere og viser hva som VILLE blitt sendt, uten å
  // faktisk sende noe eller lagre i email_log. Kun brukt til manuell
  // verifisering. "today" kan kun overstyres i dryRun, aldri ved ekte sending.
  const dryRun = req.query?.dryRun === 'true'
  const today = (dryRun && req.query?.today) || todayInOslo()
  const reminder = SCHEDULED_REMINDERS.find((r) => r.date === today)

  if (!reminder) {
    return res.status(200).json({ matched: false, today, dryRun })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY er ikke satt opp' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, email')
  if (studentsError) {
    console.error('Supabase-feil (students):', studentsError)
    return res.status(500).json({ error: 'Klarte ikke hente studenter' })
  }

  const { data: progress, error: progressError } = await supabase
    .from('student_assignments')
    .select('student_id, status')
    .eq('assignment_id', reminder.assignmentId)
  if (progressError) {
    console.error('Supabase-feil (student_assignments):', progressError)
    return res.status(500).json({ error: 'Klarte ikke hente fremdrift' })
  }

  const clearedIds = new Set(progress.filter((p) => p.status === 'cleared').map((p) => p.student_id))
  const recipients = students.filter((s) => s.email && !clearedIds.has(s.id))

  const emailType = `reminder:${reminder.assignmentId}:${reminder.date}`
  const { data: alreadySent } = await supabase
    .from('email_log')
    .select('student_id')
    .eq('email_type', emailType)
  const alreadySentIds = new Set((alreadySent || []).map((r) => r.student_id))

  if (dryRun) {
    return res.status(200).json({
      matched: true,
      dryRun: true,
      today,
      assignmentId: reminder.assignmentId,
      subject: reminder.subject,
      wouldSendTo: recipients
        .filter((s) => !alreadySentIds.has(s.id))
        .map((s) => ({ id: s.id, name: s.name, email: s.email })),
      alreadySentCount: recipients.filter((s) => alreadySentIds.has(s.id)).length,
    })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Digitabel <onboarding@resend.dev>'
  const replyTo = process.env.EMAIL_REPLY_TO

  const results = { sent: [], skipped: [], errors: [] }

  for (const student of recipients) {
    if (alreadySentIds.has(student.id)) {
      results.skipped.push(student.id)
      continue
    }
    const firstName = student.name.split(' ')[0]
    try {
      await resend.emails.send({
        from,
        ...(replyTo ? { replyTo } : {}),
        to: student.email,
        subject: reminder.subject,
        html: reminder.html(firstName),
      })
      await supabase.from('email_log').insert({ student_id: student.id, email_type: emailType })
      results.sent.push(student.id)
    } catch (err) {
      console.error(`Påminnelse feilet for ${student.name}:`, err.message)
      results.errors.push({ studentId: student.id, error: err.message })
    }
  }

  return res.status(200).json({
    matched: true,
    today,
    assignmentId: reminder.assignmentId,
    sent: results.sent.length,
    skipped: results.skipped.length,
    errors: results.errors,
  })
}
