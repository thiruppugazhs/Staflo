import { useRef, useEffect, useState } from 'react'
import { api } from '../api/client'
import { Bot, X, Send, Trash2 } from 'lucide-react'

type Msg = { role: 'user' | 'assistant', text: string, sources?: string[] }

export default function Chatbot(){
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  },[msgs, thinking, open])

  const ask = async(e?:React.FormEvent)=>{
    e?.preventDefault()
    const q = input.trim()
    if(!q || thinking) return
    setInput('')
    setMsgs(m=>[...m, {role:'user', text:q}])
    setThinking(true)
    try{
      const {data} = await api.post('/chatbot/ask', {question: q})
      setMsgs(m=>[...m, {role:'assistant', text:data.answer, sources:data.data_used}])
    }catch(ex:any){
      const detail = ex.response?.status===429 ? 'Rate limit reached — max 20 questions/hour.' : (ex.response?.data?.detail || 'Something went wrong. Try again.')
      setMsgs(m=>[...m, {role:'assistant', text:detail}])
    }finally{ setThinking(false) }
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={()=>setOpen(true)}
          title="HR Assistant (AI)"
          aria-label="Open HR Assistant chat"
          className="fixed bottom-5 right-5 z-40 h-13 w-13 h-[52px] w-[52px] rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center hover:scale-105 transition"
        >
          <Bot className="h-6 w-6"/>
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-950"/>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[92vw] max-w-sm h-[480px] max-h-[70vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Bot className="h-4.5 w-4.5 h-[18px] w-[18px]"/></span>
              <div>
                <div className="text-sm font-semibold leading-none">HR Assistant</div>
                <div className="text-[10px] opacity-80 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> AI • answers from your live data</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={()=>setMsgs([])} title="Clear conversation" className="h-7 w-7 rounded-md hover:bg-white/20 flex items-center justify-center"><Trash2 className="h-3.5 w-3.5"/></button>
              <button onClick={()=>setOpen(false)} title="Close" className="h-7 w-7 rounded-md hover:bg-white/20 flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {msgs.length===0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Bot className="h-8 w-8 text-zinc-300 dark:text-zinc-700"/>
                <p className="mt-2 text-sm font-medium">Ask me anything HR</p>
                <p className="text-xs text-zinc-500 mt-1">e.g. "How many leaves do I have left?", "What's my salary breakdown?", "When did I last check in?"</p>
              </div>
            )}
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role==='user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm'}`}>
                  {m.text}
                  {m.sources && m.sources.length>0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.sources.map(s=>(
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{s.replace('_',' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-500 flex items-center gap-1.5">
                  Thinking
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'300ms'}}/>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={ask} className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              placeholder="Type your HR question…"
              maxLength={500}
              className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 text-sm outline-none focus:border-violet-400"
            />
            <button type="submit" disabled={!input.trim() || thinking} className="h-9 w-9 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 transition shrink-0">
              <Send className="h-4 w-4"/>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
