import React, { useState, useRef, useEffect, useCallback } from 'react'
import { sendChat, resetChat } from '../api/client'
import { Send, RotateCcw, Bot, User, AlertTriangle, Sparkles } from 'lucide-react'

const WELCOME = `Hello. I'm your market intelligence assistant, powered by Claude AI.

Ask me anything about stocks or crypto:
• "What is Bitcoin's current price?"
• "Compare AAPL and TSLA performance"
• "Give me a full market overview"
• "I have 10 NVDA and 0.5 ETH — what's my portfolio worth?"`

const SUGGESTIONS = [
  'Bitcoin price?',
  'Market overview',
  'Compare AAPL vs TSLA',
  'Top crypto today',
]

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 items-end">
        <div className="max-w-[82%] bg-gradient-to-br from-accent to-violet-600 rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white leading-relaxed shadow-lg shadow-accent/20">
          {msg.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User size={13} className="text-accent" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex gap-2 items-start">
        <div className="w-7 h-7 rounded-full bg-loss/15 border border-loss/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={12} className="text-loss" />
        </div>
        <div className="max-w-[90%] bg-loss/8 border border-loss/25 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-loss/90 leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/30 to-violet-600/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-accent2" />
      </div>
      <div className="max-w-[90%] bg-surface2/80 border border-border2 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/30 to-violet-600/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-accent2" />
      </div>
      <div className="bg-surface2/80 border border-border2 rounded-2xl rounded-tl-md px-4 py-3.5">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME, id: 0 }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const idRef = useRef(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(async (text_override) => {
    const text = (text_override || input).trim()
    if (!text || loading) return

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { role: 'user', content: text, id: idRef.current++ }])
    setLoading(true)

    try {
      const res = await sendChat(text)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, id: idRef.current++ }])
    } catch (e) {
      const errMsg = e?.response?.data?.detail || e.message || 'Failed to reach the server. Please try again.'
      setMessages(prev => [...prev, { role: 'error', content: errMsg, id: idRef.current++ }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = async () => {
    try { await resetChat() } catch {}
    setMessages([{ role: 'assistant', content: WELCOME, id: idRef.current++ }])
    setInput('')
    setLoading(false)
    setShowSuggestions(true)
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-gradient-to-r from-surface to-surface2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center shadow-md shadow-accent/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text">AI Assistant</div>
            <div className="text-xs text-muted">Powered by Claude</div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-subtext transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface2 border border-transparent hover:border-border"
        >
          <RotateCcw size={11} />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 1 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent2 hover:bg-accent/20 hover:border-accent/40 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3.5 border-t border-border bg-surface/80">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about stocks, crypto, market trends..."
            rows={1}
            disabled={loading}
            className="
              flex-1 bg-surface2/60 border border-border2 rounded-xl
              px-4 py-2.5 text-sm text-text placeholder-muted
              resize-none focus:outline-none focus:border-accent/50 focus:bg-surface2/80
              disabled:opacity-50 transition-all leading-relaxed
            "
            style={{ maxHeight: '100px' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="
              p-2.5 rounded-xl bg-gradient-to-br from-accent to-violet-600
              hover:from-accent hover:to-violet-500
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all shadow-md shadow-accent/25 flex-shrink-0
            "
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-muted mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
