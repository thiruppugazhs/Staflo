import { useRef, useEffect, useState } from 'react'
import { api } from '../api/client'
import { Sparkles, X, Send, Trash2, Bot } from 'lucide-react'

type Msg = { role: 'user' | 'assistant', text: string, sources?: string[], agent?: string }

export default function Chatbot(){
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'assistant',
      text: "Hi! I'm Raya, your Staflo HR AI Assistant. I can help with your leave balance, attendance records, payroll breakdown, upcoming meetings, and company policies. How can I help you today?",
      agent: 'Raya'
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  },[msgs, thinking, open])

  const ask = async(e?:React.FormEvent, customQ?: string)=>{
    e?.preventDefault()
    const q = (customQ || input).trim()
    if(!q || thinking) return
    if (!customQ) setInput('')
    setMsgs(m=>[...m, {role:'user', text:q}])
    setThinking(true)
    try{
      const {data} = await api.post('/chatbot/ask', {question: q})
      setMsgs(m=>[...m, {role:'assistant', text:data.answer, sources:data.data_used, agent: data.agent || 'Raya'}])
    }catch(ex:any){
      const detail = ex.response?.status===429 ? 'Rate limit reached — max 20 questions/hour.' : (ex.response?.data?.detail || 'Something went wrong. Try again.')
      setMsgs(m=>[...m, {role:'assistant', text:detail, agent: 'Raya'}])
    }finally{ setThinking(false) }
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={()=>setOpen(true)}
          title="Raya — Staflo AI Agent"
          aria-label="Open Raya AI chat"
          className="fixed bottom-5 right-5 z-40 h-[52px] w-[52px] rounded-full bg-gradient-to-br from-[var(--theme-primary,#004E72)] to-[var(--theme-accent,#FF6E42)] text-white shadow-lg shadow-[var(--theme-primary)]/25 flex items-center justify-center hover:scale-105 transition active:scale-95"
        >
          <Sparkles className="h-6 w-6"/>
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-950"/>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[92vw] max-w-sm h-[500px] max-h-[75vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 bg-gradient-to-r from-[var(--theme-primary,#004E72)] to-[var(--theme-secondary,#092634)] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[var(--theme-accent,#FF6E42)]" />
              </span>
              <div>
                <div className="text-sm font-bold leading-none flex items-center gap-1.5">
                  Raya
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 uppercase tracking-widest font-mono">Gemini AI</span>
                </div>
                <div className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Staflo HR AI Agent
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={()=>setMsgs([
                  {
                    role: 'assistant',
                    text: "Chat cleared. What else can I assist you with?",
                    agent: 'Raya'
                  }
                ])}
                title="Clear chat"
                className="h-7 w-7 rounded-md hover:bg-white/20 flex items-center justify-center transition opacity-80 hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
              <button
                onClick={()=>setOpen(false)}
                title="Close chat"
                className="h-7 w-7 rounded-md hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="h-4 w-4"/>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 p-3 space-y-3 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 text-xs">
            {msgs.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1.5 shadow-xs ${
                    m.role === 'user'
                      ? 'bg-[var(--theme-primary,#004E72)] text-white rounded-br-none'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-700/60 flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] text-zinc-400">Sources:</span>
                      {m.sources.map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none px-3.5 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary,#004E72)] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-accent,#FF6E42)] animate-bounce [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary,#004E72)] animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[10px] text-zinc-400 ml-1">Raya is thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {['Leave balance?', 'Net salary?', 'Next meeting?'].map((q) => (
              <button
                key={q}
                onClick={() => ask(undefined, q)}
                className="text-[10px] px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={ask} className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-1.5 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Raya anything about your HR profile..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary,#004E72)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="h-8 w-8 rounded-xl bg-[var(--theme-primary,#004E72)] hover:bg-[var(--theme-accent,#FF6E42)] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
