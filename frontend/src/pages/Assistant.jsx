import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'
import { MessageSquare, Send, Loader2, User, Bot } from 'lucide-react'

const STARTERS = [
  'How do I control Fall Armyworm on maize?',
  'What fertilizer should I apply after planting?',
  'My tomato leaves are turning yellow — why?',
  'When should I plant beans in Nakuru?',
]

export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    const updated = [...messages, { role: 'user', content: msg }]
    setMessages(updated)
    setLoading(true)
    try {
      const { data } = await api.post('/api/chat/', { messages: updated })
      setMessages([...updated, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, I could not connect to the assistant. Please check the backend is running.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <MessageSquare size={20} className="text-forest" />
          <h1 className="font-display text-2xl text-charcoal">Farm Assistant</h1>
        </div>
        <p className="text-gray-500 text-sm">Ask anything about your crops. Responds in English or Swahili.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="card text-center py-8">
              <Bot size={32} className="text-forest/30 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-semibold">CropVet Farm Assistant</p>
              <p className="text-xs text-gray-400 mt-1">Expert advice for Kenyan smallholder farmers</p>
            </div>
            <p className="text-xs text-gray-400 text-center">Try one of these:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-sm text-gray-600 border border-gray-200 rounded-xl px-3 py-2.5 hover:border-forest hover:text-forest transition-colors bg-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 fade-in ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
              ${m.role === 'user' ? 'bg-earth' : 'bg-forest'}`}>
              {m.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${m.role === 'user'
                ? 'bg-earth text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 text-charcoal rounded-tl-sm shadow-card'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 fade-in">
            <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-card">
              <Loader2 size={14} className="animate-spin text-forest" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 shrink-0">
        <input
          className="input flex-1"
          placeholder="Ask about your crops…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-earth px-4">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
