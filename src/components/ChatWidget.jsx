import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { sendChatMessage } from '../lib/ai'

const GREETING = {
  role: 'assistant',
  content:
    'Привет! Я помогу оформить репорт или отвечу на вопросы о баллах и правилах Kepil. Что вас интересует?',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const reply = await sendChatMessage(
        text,
        nextMessages.filter((m) => m !== GREETING)
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Не удалось получить ответ. Попробуйте ещё раз позже.' },
      ])
    }
    setSending(false)
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[1100] flex flex-col items-end">
      {open && (
        <div className="mb-3 w-full sm:w-80 h-[70vh] max-h-96 bg-white rounded-2xl shadow-2xl border border-sand-dark/20 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-sea to-turquoise text-white px-4 py-3 flex items-center justify-between shrink-0">
            <span className="font-medium text-sm flex items-center gap-2">
              <MessageCircle size={18} />
              Помощник Kepil
            </span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'self-end bg-sea text-white rounded-br-sm'
                    : 'self-start bg-sand/40 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="self-start text-xs text-gray-400 px-3">Печатает…</div>}
          </div>
          <form onSubmit={handleSend} className="flex border-t border-sand-dark/20 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ваш вопрос…"
              className="flex-1 px-3 py-2.5 text-sm outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Отправить"
              className="px-3 text-sea-dark disabled:opacity-40 flex items-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-sea to-turquoise text-white shadow-lg flex items-center justify-center shrink-0 ${
          open ? '' : 'animate-pulse-ring'
        }`}
        aria-label="Открыть чат-помощник"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}
