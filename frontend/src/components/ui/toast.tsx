import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number, type: ToastType, message: string }

const ToastCtx = createContext<{
  success: (msg: string) => void,
  error: (msg: string) => void,
  info: (msg: string) => void,
} | null>(null)

export function useToast(){
  const ctx = useContext(ToastCtx)
  if(!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200',
  error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200',
  info: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200',
}
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500"/>,
  error: <XCircle className="h-4.5 w-4.5 shrink-0 text-red-500"/>,
  info: <Info className="h-4.5 w-4.5 shrink-0 text-sky-500"/>,
}

export function ToastProvider({ children }:{ children: React.ReactNode }){
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id:number)=>{
    setItems(list=> list.filter(t=> t.id!==id))
  },[])

  const push = useCallback((type:ToastType, message:string)=>{
    const id = ++idRef.current
    setItems(list=> [...list.slice(-4), {id, type, message}])
    setTimeout(()=> dismiss(id), type==='error' ? 6000 : 4000)
  },[dismiss])

  const api = {
    success: (msg:string)=> push('success', msg),
    error: (msg:string)=> push('error', msg),
    info: (msg:string)=> push('info', msg),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Response toasts for every create/update/delete action */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
        {items.map(t=>(
          <div key={t.id} role="status" className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-sm animate-[toast-in_.18s_ease-out] ${styles[t.type]}`}>
            {icons[t.type]}
            <span className="flex-1 text-sm leading-snug break-words">{t.message}</span>
            <button onClick={()=>dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition" aria-label="Dismiss">
              <X className="h-4 w-4"/>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
