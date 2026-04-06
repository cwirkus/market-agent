import React, { useState, useRef, useEffect, useCallback } from 'react'
import { sendChat, resetChat } from '../api/client'
import { Send, RotateCcw, AlertTriangle } from 'lucide-react'

const WELCOME = `Ask me about any crypto or stock.

Examples:
• "Is this 45% 24h move on PEPE sustainable?"
• "What do you think about Solana right now?"
• "Compare Bitcoin vs Ethereum this week"
• "I hold 2 ETH and 500 SOL — what's my portfolio worth?"`

export default function Chat({ initialMessage, onPromptConsumed }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME, id: 0 }
  ])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)
  const idRef                     = useRef(1)
  const consumedRef               = useRef(null)

  // Auto-send when parent passes an initialMessage
  useEffect(() => {
    if (initialMessage && initialMessage !== consumedRef.current) {
      consumedRef.current = initialMessage
      onPromptConsumed?.()
      send(initialMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, id: idRef.current++ }])
    setLoading(true)

    try {
      const res = await sendChat(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, id: idRef.current++ }])
    } catch (e) {
      const err = e?.response?.data?.detail || e.message || 'Connection failed. Is the backend running?'
      setMessages(prev => [...prev, { role: 'error', content: err, id: idRef.current++ }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleReset = async () => {
    try { await resetChat() } catch {}
    setMessages([{ role: 'assistant', content: WELCOME, id: idRef.current++ }])
    setInput('')
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full border border-border rounded bg-surface overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-text">AI Analyst</span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-subtext transition-colors"
        >
          <RotateCcw size={10} />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
        ))}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any coin or market..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-surface2 border border-border rounded px-3 py-2 text-xs text-text placeholder-muted resize-none focus:outline-none focus:border-border2 disabled:opacity-40 transition-colors leading-relaxed"
            style={{ maxHeight: '96px' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="p-2 bg-gain/10 border border-gain/30 rounded text-gain hover:bg-gain/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-surface2 border border-border2 rounded px-3 py-2 text-xs text-text leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex gap-2 items-start">
        <AlertTriangle size={12} className="text-loss mt-0.5 flex-shrink-0" />
        <div className="text-xs text-loss/80 leading-relaxed">{msg.content}</div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="w-4 h-4 rounded bg-gain/15 border border-gain/25 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[8px] font-bold text-gain">AI</span>
      </div>
      <div className="text-xs text-text leading-relaxed whitespace-pre-wrap">{msg.content}</div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-4 h-4 rounded bg-gain/15 border border-gain/25 flex items-center justify-center flex-shrink-0">
        <span className="text-[8px] font-bold text-gain">AI</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-subtext animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
