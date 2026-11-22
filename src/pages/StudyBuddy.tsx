import { useEffect, useState } from 'react'
import { Brain, Send, Sparkles, RotateCcw } from 'lucide-react'
import { sendMessageToPeekAI } from '../services/aiServices'
import '../styles/study-buddy.css'

type Message = { role: 'assistant' | 'user'; content: string }
const KEY = 'peekai-study-buddy-chat-v1'
const greeting: Message = { role: 'assistant', content: 'Hi! I’m your Study Buddy. Ask me about a topic, paste a difficult question, or ask for a hint before the full explanation.' }
function restore(): Message[] { try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(value) && value.length ? value : [greeting] } catch { return [greeting] } }
export default function StudyBuddy() {
  const [messages, setMessages] = useState<Message[]>(restore)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(messages)) }, [messages])
  async function send(text: string) {
    const question = text.trim()
    if (!question || busy) return
    setMessages(old => [...old, { role: 'user', content: question }]); setInput(''); setError(''); setBusy(true)
    try {
      const reply = await sendMessageToPeekAI(question)
      setMessages(old => [...old, { role: 'assistant', content: reply }])
    } catch (err) { setError(err instanceof Error ? err.message : 'Study Buddy is unavailable. Check the FastAPI backend.') }
    finally { setBusy(false) }
  }
  return <div className="page-content buddy-page">
    <header className="buddy-heading"><div className="eyebrow"><Sparkles size={14}/> YOUR AI TUTOR</div><h1>Study Buddy</h1><p>Ask questions, explore concepts and work through problems at your own pace.</p></header>
    <section className="buddy-shell">
      <div className="buddy-toolbar"><span><Brain size={18}/> Ask PeekAI</span><button onClick={() => { if (window.confirm('Clear this conversation?')) { setMessages([greeting]); setError('') } }}><RotateCcw size={15}/> New conversation</button></div>
      <div className="buddy-messages" aria-live="polite">{messages.map((message, i) => <div key={i} className={`buddy-message ${message.role}`}>{message.content}</div>)}{busy && <div className="buddy-message assistant">Thinking…</div>}</div>
      {error && <p className="buddy-error" role="alert">{error}</p>}
      {messages.length === 1 && <div className="buddy-prompts">{['Explain this topic step by step', 'Give me a hint instead of the answer', 'Help me understand my mistake'].map(prompt => <button key={prompt} onClick={() => { setInput(prompt) }}>{prompt}</button>)}</div>}
      <form className="buddy-compose" onSubmit={e => { e.preventDefault(); void send(input) }}><textarea aria-label="Ask Study Buddy" rows={2} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about your studies…"/><button type="submit" disabled={!input.trim() || busy}><Send size={18}/> Send</button></form>
    </section>
    <p className="buddy-note">Study Buddy uses the existing PeekAI chat endpoint. Conversational history is stored on this device; multi-turn AI context and syllabus-aware chat are planned improvements.</p>
  </div>
}
