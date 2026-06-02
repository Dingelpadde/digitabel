import { useState, useEffect, useRef } from 'react'
import { saveChatMessage, upsertStudentAssignment } from '../../lib/supabase'
import CharacterSprite from '../character/CharacterSprite'
import { DIGITABEL_VOICE } from '../../data/personality'

const CLEARED_MARKER = '✓ CLEARED'

function buildSystemPrompt(assignment, prepAnswers) {
  const answersText = prepAnswers
    .map((a, i) => `Q${i + 1}: ${a.question_text}\nSvar: ${a.answer}`)
    .join('\n\n')

  return `${DIGITABEL_VOICE}

---

${assignment.systemPrompt}

---
Studenten har sendt inn følgende forberedelsessvar:

${answersText}
---

Bruk disse svarene som kontekst for ditt første spørsmål. Referer spesifikt til dem for å vise at du har lest dem.`
}

// Detekter om innhold handler om psykisk helse
const MENTAL_HEALTH_KEYWORDS = [
  'selvmord', 'ta livet', 'ikke orker', 'gi opp', 'depresjon', 'angst', 'krise',
  'hjelp meg', 'ingen mening', 'fortvilelse', 'suicid',
]
function hasMentalHealthContent(text) {
  const lower = text.toLowerCase()
  return MENTAL_HEALTH_KEYWORDS.some((kw) => lower.includes(kw))
}

const MENTAL_HEALTH_RESPONSE = `Jeg hører at du har det tungt akkurat nå. Det er modig av deg å si det.

Jeg er her som et faglig verktøy og er ikke den rette til å hjelpe med dette — men det finnes folk som er det.

Ta kontakt med Studentsamskipnadens helsetjeneste:
📞 SiO Helse: 22 85 32 00
🌐 sio.no/helse

Eller snakk med noen du stoler på. Du fortjener støtte.`

export default function ChatInterface({
  assignment,
  studentAssignment,
  prepAnswers,
  initialMessages,
  onCleared,
}) {
  const [messages, setMessages] = useState(initialMessages || [])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [cleared, setCleared] = useState(
    initialMessages?.some((m) => m.content.includes(CLEARED_MARKER)) || false
  )
  const [error, setError] = useState('')
  const [pose, setPose] = useState('idle')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const isFirstMessage = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-start: Digitabel sender første melding
  useEffect(() => {
    if (isFirstMessage && !streaming) {
      sendToClaudeWithHistory([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendToClaudeWithHistory = async (history) => {
    setStreaming(true)
    setPose('thinking')
    setStreamingText('')
    setError('')

    const systemPrompt = buildSystemPrompt(assignment, prepAnswers)
    const apiMessages =
      history.length === 0
        ? [{ role: 'user', content: '[SYSTEM: Start samtalen med å hilse på studenten og still ditt første utfordrende spørsmål basert på forberedelsessvarene.]' }]
        : history.map((m) => ({ role: m.role, content: m.content }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, systemPrompt }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'API-feil')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      setPose('talking')
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setStreamingText(fullText)
      }

      const assistantMsg = { role: 'assistant', content: fullText, created_at: new Date().toISOString() }
      const isKickoff = history.length === 0
      const newMessages = isKickoff ? [assistantMsg] : [...history, assistantMsg]
      setMessages(newMessages)
      setStreamingText('')
      setPose('idle')

      try {
        await saveChatMessage(studentAssignment.id, 'assistant', fullText)
      } catch {
        // Offline — fortsetter lokalt
      }

      if (fullText.includes(CLEARED_MARKER)) {
        setCleared(true)
        try {
          const updated = await upsertStudentAssignment({
            studentId: studentAssignment.student_id,
            assignmentId: studentAssignment.assignment_id,
            status: 'cleared',
          })
          onCleared(updated, newMessages)
        } catch {
          onCleared({ ...studentAssignment, status: 'cleared' }, newMessages)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Klarte ikke å nå Digitabel. Sjekk API-nøkkel eller nettverksforbindelsen.')
      setPose('idle')
    } finally {
      setStreaming(false)
      setStreamingText('')
      inputRef.current?.focus()
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming || cleared) return

    // Psykisk helse-protokoll
    if (hasMentalHealthContent(text)) {
      const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() }
      const safeMsg = { role: 'assistant', content: MENTAL_HEALTH_RESPONSE, created_at: new Date().toISOString() }
      setPose('serious')
      setMessages((prev) => [...prev, userMsg, safeMsg])
      setInput('')
      setTimeout(() => setPose('idle'), 5000)
      try {
        await saveChatMessage(studentAssignment.id, 'user', text)
        await saveChatMessage(studentAssignment.id, 'assistant', MENTAL_HEALTH_RESPONSE)
      } catch { /* offline */ }
      return
    }

    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    try {
      await saveChatMessage(studentAssignment.id, 'user', text)
    } catch { /* offline */ }

    await sendToClaudeWithHistory(newMessages)
  }

  const renderMessageContent = (content) => {
    if (content.includes(CLEARED_MARKER)) {
      const parts = content.split(CLEARED_MARKER)
      return (
        <>
          <span style={{ whiteSpace: 'pre-wrap' }}>{parts[0]}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(106,176,76,0.15)',
              border: '2px solid #6ab04c',
              boxShadow: '2px 2px 0 #000',
              color: '#6ab04c',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              padding: '4px 8px',
              margin: '0 4px',
            }}
          >
            {CLEARED_MARKER}
          </span>
          <span style={{ whiteSpace: 'pre-wrap' }}>{parts[1]}</span>
        </>
      )
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>

      {/* Kontekst-stripe */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-border)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-accent)', fontFamily: '"Press Start 2P"', fontSize: 7 }}>
            DIGITABEL
          </span>
          {' '} sparrer deg på: <strong style={{ color: 'var(--color-text)' }}>{assignment.title}</strong>
        </p>
        {cleared && (
          <span
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              color: '#6ab04c',
              background: 'rgba(106,176,76,0.1)',
              border: '2px solid #6ab04c',
              boxShadow: '2px 2px 0 #000',
              padding: '4px 8px',
            }}
          >
            CLEARED
          </span>
        )}
      </div>

      {/* Meldinger */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Spinner ved oppstart */}
          {messages.length === 0 && streaming && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 32, height: 32,
                  background: 'var(--color-surface)',
                  border: '2px solid var(--color-accent)',
                  boxShadow: '2px 2px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: '"Press Start 2P"', fontSize: 10, color: 'var(--color-accent)',
                }}
              >A</div>
              <div className="bubble-in">
                {streamingText ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{streamingText}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                )}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="chat-message"
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: 'var(--color-surface)',
                  border: `2px solid ${msg.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  boxShadow: '2px 2px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Press Start 2P"', fontSize: 9,
                  color: msg.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {msg.role === 'assistant' ? 'A' : 'Du'}
              </div>

              {/* Boble */}
              <div style={{ flex: 1, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={msg.role === 'assistant' ? 'bubble-in' : 'bubble-out'}>
                  {msg.role === 'assistant' ? renderMessageContent(msg.content) : msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming-boble */}
          {streaming && messages.length > 0 && (
            <div className="chat-message" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: 'var(--color-surface)',
                  border: '2px solid var(--color-accent)',
                  boxShadow: '2px 2px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Press Start 2P"', fontSize: 10, color: 'var(--color-accent)',
                }}
              >A</div>
              <div className="bubble-in">
                {streamingText ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{streamingText}<span style={{ opacity: 0.6, animation: 'none' }}>▌</span></span>
                ) : (
                  <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(231,76,60,0.1)',
                border: '2px solid var(--color-danger)',
                boxShadow: '2px 2px 0 #000',
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--color-danger)',
              }}
            >
              {error}
            </div>
          )}

          {cleared && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(106,176,76,0.1)',
                  border: '2px solid #6ab04c',
                  boxShadow: '3px 3px 0 #000',
                  padding: '10px 20px',
                  fontFamily: '"Press Start 2P"', fontSize: 7,
                  color: '#6ab04c',
                  lineHeight: 1.8,
                }}
              >
                ✓ Du er klarert for veiledning
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* CharacterSprite + input-rad */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderTop: '2px solid var(--color-border)',
        }}
      >
        {/* Karakter */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <CharacterSprite pose={pose} size="md" animated={true} />
        </div>

        {/* Input-rad */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {cleared ? (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 0' }}>
                Sparring fullført. Rull opp for å lese samtalen, eller gå videre til refleksjon.
              </p>
            ) : (
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Skriv svaret ditt..."
                  disabled={streaming}
                  className="input"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={streaming || !input.trim()}
                  style={{ flexShrink: 0, padding: '10px 16px' }}
                >
                  {streaming ? (
                    <span style={{ fontFamily: '"Press Start 2P"', fontSize: 7 }}>...</span>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
