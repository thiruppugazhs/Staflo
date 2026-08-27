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
          title="DailyFlow HR Assistant (AI)"
          aria-label="Open HR Assistant chat"
          className="fixed bottom-5 right-5 z-40 h-[52px] w-[52px] rounded-full bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-400 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Bot className="h-6 w-6 text-stone-950"/>
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-950"/>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[92vw] max-w-sm h-[480px] max-h-[70vh] rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-amber-500 text-stone-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-stone-950/10 flex items-center justify-center"><Bot className="h-[18px] w-[18px] text-stone-950"/></span>
              <div>
                <div className="text-sm font-bold leading-none text-stone-950">DayFlow Assistant</div>
                <div className="text-[10px] text-stone-900/80 font-medium flex items-center gap-1 mt-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/> AI • live workforce data</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={()=>setMsgs([])} title="Clear conversation" className="h-7 w-7 rounded-md hover:bg-stone-950/10 flex items-center justify-center text-stone-950 cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
              <button onClick={()=>setOpen(false)} title="Close" className="h-7 w-7 rounded-md hover:bg-stone-950/10 flex items-center justify-center text-stone-950 cursor-pointer"><X className="h-4 w-4"/></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-stone-50/50 dark:bg-stone-950/30">
            {msgs.length===0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-2">
                  <Bot className="h-6 w-6 text-amber-600 dark:text-amber-400"/>
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Ask me anything HR</p>
                <p className="text-xs text-stone-500 mt-1">e.g. "How many leaves do I have left?", "What's my salary breakdown?", "When did I last check in?"</p>
              </div>
            )}
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium ${m.role==='user'
                  ? 'bg-amber-500 text-stone-950 rounded-br-xs shadow-2xs font-semibold'
                  : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-xs border border-stone-200 dark:border-stone-700 shadow-2xs'}`}>
                  {m.text}
                  {m.sources && m.sources.length>0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.sources.map(s=>(
                        <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300">{s.replace('_',' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3.5 py-2 text-xs text-stone-500 flex items-center gap-1.5 shadow-2xs">
                  Thinking
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{animationDelay:'300ms'}}/>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={ask} className="p-2.5 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              placeholder="Type your HR question…"
              maxLength={500}
              className="flex-1 h-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <button type="submit" disabled={!input.trim() || thinking} className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center hover:bg-amber-600 active:scale-95 disabled:opacity-50 transition shrink-0 cursor-pointer shadow-xs">
              <Send className="h-4 w-4"/>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

