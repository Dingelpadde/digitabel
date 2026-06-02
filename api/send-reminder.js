// Node.js runtime (not edge) — needs Twilio/Resend SDKs
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { studentIds, assignmentId } = req.body

  if (!studentIds || !Array.isArray(studentIds) || !assignmentId) {
    return res.status(400).json({ error: 'Missing studentIds or assignmentId' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  // Fetch student contact info
  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, email, phone')
    .in('id', studentIds)

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: 'Failed to fetch students' })
  }

  const results = { sms: [], email: [], errors: [] }

  for (const student of students) {
    const message = `Hi ${student.name.split(' ')[0]}, reminder: you haven't started the AI sparring session for assignment ${assignmentId} yet. Log in at DigitABEL to get started before your supervision meeting.`

    // ── SMS via Twilio ──────────────────────────────────────────────────────
    if (student.phone && process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilio = (await import('twilio')).default
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_FROM_NUMBER,
          to: student.phone,
        })
        results.sms.push(student.id)
      } catch (err) {
        console.error(`SMS failed for ${student.name}:`, err.message)
        results.errors.push({ studentId: student.id, type: 'sms', error: err.message })
      }
    }

    // ── Email via Resend ────────────────────────────────────────────────────
    if (student.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@digitabel.app',
          to: student.email,
          subject: 'Reminder: AI sparring not started',
          html: `<p>Hi ${student.name.split(' ')[0]},</p>
<p>This is a reminder that you haven't started the AI sparring session for <strong>Assignment ${assignmentId}</strong> yet.</p>
<p>Please log in to DigitABEL and complete the sparring session before your supervision meeting.</p>
<p>— Your teacher</p>`,
        })
        results.email.push(student.id)
      } catch (err) {
        console.error(`Email failed for ${student.name}:`, err.message)
        results.errors.push({ studentId: student.id, type: 'email', error: err.message })
      }
    }
  }

  return res.status(200).json({
    sent: { sms: results.sms.length, email: results.email.length },
    errors: results.errors,
  })
}
