// Node.js runtime — bruker Resend for e-post.
// Sender en vennlig invitasjon til å ta en runde med Digitabel før
// veiledningen med Abel. Ingen SMS (vi samler ikke inn telefonnummer).
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { studentIds, assignmentTitle, appUrl } = req.body

  if (!studentIds || !Array.isArray(studentIds) || !assignmentTitle) {
    return res.status(400).json({ error: 'Mangler studentIds eller assignmentTitle' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY er ikke satt opp' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, email')
    .in('id', studentIds)

  if (error) {
    console.error('Supabase-feil:', error)
    return res.status(500).json({ error: 'Klarte ikke hente studenter' })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Digitabel <onboarding@resend.dev>'
  const replyTo = process.env.EMAIL_REPLY_TO // Abels e-post, så svar går til ham
  const link = appUrl || 'https://digitabel.vercel.app'

  const results = { email: [], errors: [] }

  for (const student of students) {
    if (!student.email) continue
    const firstName = student.name.split(' ')[0]

    try {
      await resend.emails.send({
        from,
        ...(replyTo ? { replyTo } : {}),
        to: student.email,
        subject: `Ta en runde med Digitabel før vi møtes – ${assignmentTitle}`,
        html: `
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2d3d; line-height: 1.6;">
  <p>Hei ${firstName}!</p>
  <p>Snart skal vi ha veiledning på temaoppgaven <strong>${assignmentTitle}</strong>. For at den samtalen skal bli best mulig, vil jeg at du tar en liten runde med <strong>Digitabel</strong> først – den digitale veilederen vår.</p>
  <p>Den hjelper deg å bli litt klarere og litt mer forberedt, helt i ditt eget tempo. Det tar ikke lang tid, og du møter mye bedre rustet til veiledningen.</p>
  <p style="text-align: center; margin: 28px 0;">
    <a href="${link}" style="background: #e8b87a; color: #1a0e04; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 4px; display: inline-block;">Start med Digitabel</a>
  </p>
  <p>Gleder meg til å se hva du har jobbet med!</p>
  <p>— Abel</p>
</div>`,
      })
      results.email.push(student.id)
    } catch (err) {
      console.error(`E-post feilet for ${student.name}:`, err.message)
      results.errors.push({ studentId: student.id, error: err.message })
    }
  }

  return res.status(200).json({
    sent: results.email.length,
    errors: results.errors,
  })
}
