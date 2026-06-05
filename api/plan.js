import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

const SYSTEM = `Du er Digitabel, en prosjektplanlegger for studenter ved Fagskolen Kristiania.

Basert på studentens svar skal du lage en realistisk, personlig milepælplan.

Svar KUN med gyldig JSON — ingen annen tekst, ingen markdown-kodeblokker, ingen forklaring:
{
  "intro": "2-3 setninger som oppsummerer planen varmt og direkte",
  "milestones": [
    { "date": "YYYY-MM-DD", "title": "Kort tittel", "description": "1-2 setninger om hva som skal gjøres" }
  ],
  "tips": "2-3 konkrete tips, én per linje"
}

Regler:
- 5-7 milepæler, logisk fordelt mot fristen
- Start med oppstart/planlegging, avslutt med innlevering eller ferdig produkt
- Ta hensyn til hvilke dager studenten ikke er tilgjengelig
- Realistisk tidsbruk basert på hva studenten oppgir
- Norsk bokmål, ingen emojier`

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { prepAnswers, editMessage, existingPlan, themeContext } = body
  if (!prepAnswers) return new Response('Missing prepAnswers', { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })

  const client = new Anthropic({ apiKey })

  // Build theme context block
  let themeBlock = ''
  if (themeContext) {
    themeBlock = `\n\nTema: ${themeContext.title}`
    if (themeContext.supervisionDate) {
      const d = new Date(themeContext.supervisionDate + 'T12:00:00')
      const dateStr = d.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })
      themeBlock += `\nVeiledningsdato med faglærer Abel: ${dateStr}. Legg inn denne datoen som en fast milepæl med tittelen "Klar til veiledning" og planlegg alle andre milepæler frem mot den.`
    }
  }

  const userMsg = editMessage && existingPlan
    ? `Prosjektsvar:\n${prepAnswers}${themeBlock}\n\nEksisterende plan:\n${JSON.stringify(existingPlan, null, 2)}\n\nStudentens endringsønske:\n${editMessage}\n\nOppdater planen basert på endringsønsket.`
    : `Prosjektsvar:\n${prepAnswers}${themeBlock}\n\nLag en milepælplan.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    })

    const text = response.content[0].text.trim()
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const plan = JSON.parse(cleaned)

    return new Response(JSON.stringify(plan), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Plan API error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Plan generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
