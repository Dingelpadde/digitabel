// Node.js runtime — sender Digitabels velkomstmail rett etter registrering.
import { createClient } from '@supabase/supabase-js'
import { WELCOME_EMAIL } from '../src/data/emailContent.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Mangler name eller email' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY er ikke satt opp' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (student) {
    const { data: alreadySent } = await supabase
      .from('email_log')
      .select('id')
      .eq('student_id', student.id)
      .eq('email_type', 'welcome')
      .maybeSingle()

    if (alreadySent) {
      return res.status(200).json({ sent: false, reason: 'allerede sendt' })
    }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Digitabel <onboarding@resend.dev>'
  const replyTo = process.env.EMAIL_REPLY_TO
  const firstName = name.split(' ')[0]

  try {
    await resend.emails.send({
      from,
      ...(replyTo ? { replyTo } : {}),
      to: email,
      subject: WELCOME_EMAIL.subject,
      html: WELCOME_EMAIL.html(firstName),
    })

    if (student) {
      await supabase.from('email_log').insert({ student_id: student.id, email_type: 'welcome' })
    }

    return res.status(200).json({ sent: true })
  } catch (err) {
    console.error('Velkomstmail feilet:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
