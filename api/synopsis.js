import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { messages, assignmentTitle, studentName } = body
  if (!messages || !assignmentTitle) return new Response('Missing fields', { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })

  const client = new Anthropic({ apiKey })

  const systemPrompt = `Du er Digitabel. Skriv en kort synopsis til faglærer Abel basert på denne veiledningssamtalen om "${assignmentTitle}"${studentName ? ` med ${studentName}` : ''}.

Dekk i 4-5 korte setninger:
- Hva studenten jobber med konkret
- Hvor langt de har kommet
- Hva de er usikre på eller trenger hjelp med
- En styrke du la merke til

Norsk bokmål. Ingen emojier. Ingen overskrift eller formatering. Direkte og nyttig for en faglærer.`

  const conversationText = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'assistant' ? 'Digitabel' : 'Student'}: ${m.content}`)
    .join('\n\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      system: systemPrompt,
      messages: [{ role: 'user', content: conversationText }],
    })

    return new Response(JSON.stringify({ synopsis: response.content[0].text.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Synopsis API error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
