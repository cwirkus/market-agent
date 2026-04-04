import React, { useState, useRef, useEffect, useCallback } from 'react'
import { sendChat, resetChat } from '../api/client'
import { Send, RotateCcw, Bot, User, AlertCircle } from 'lucide-react'

const WELCOME = `Hello. I'm your market intelligence assistant.

Ask me anything about stocks or crypto. For example:
• "What is Bitcoin's current price?"
• "Compare AAPL and TSLA"
• "Give me a full market overview"
• "I have 10 shares of NVDA and 0.5 ETH — what's my portfolio worth?"`

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 items-end">
        <div className="max-w-[80%] bg-accent rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white leading-relaxed">
          {msg.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User size={13} className="text-accent" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex gap-2 items-start">
        <div className="w-7 h-7 rounded-full bg-loss/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle size={13} className="text-loss" />
        </div>
        <div className="max-w-[90%] bg-loss/10 border border-loss/30 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-loss leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-accent" />
      </div>
      <div className="max-w-[90%] bg-gray-800/60 border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-accent" />
      </div>
      <div className="bg-gray-800/60 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-subtext animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
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
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const idRef = useRef(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text, id: idRef.current++ }])
    setLoading(true)

    try {
      const res = await sendChat(text)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, id: idRef.current++ }])
    } catch (e) {
      const errMsg = e?.response?.data?.detail || e.message || 'Failed to reach the server.'
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
    try {
      await resetChat()
    } catch {}
    setMessages([{ role: 'assistant', content: WELCOME, id: idRef.current++ }])
    setInput('')
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gain animate-pulse" />
          <span className="text-sm font-semibold text-text">AI Assistant</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-subtext transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
        >
          <RotateCcw size={11} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-gray-900/30">
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
              flex-1 bg-gray-800/60 border border-border rounded-xl
              px-4 py-2.5 text-sm text-text placeholder-muted
              resize-none focus:outline-none focus:border-accent/50
              disabled:opacity-50 transition-colors
              leading-relaxed
            "
            style={{ maxHeight: '120px' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="
              p-2.5 rounded-xl bg-accent hover:bg-indigo-500 disabled:opacity-40
              disabled:cursor-not-allowed transition-colors flex-shrink-0
            "
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-muted mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
