import { useState } from 'react'
import { Phone, MessageCircle, Mail, Video, Copy, Check } from 'lucide-react'
import { api } from '../api/client'

type UserLike = {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

function cleanPhone(raw?: string) {
  if (!raw) return ''
  let s = raw.replace(/[\s\-\(\)]/g, '')
  // strip leading +91, 91, 0
  if (s.startsWith('+91')) s = s.slice(3)
  else if (s.startsWith('91') && s.length > 10) s = s.slice(2)
  else if (s.startsWith('0') && s.length > 10) s = s.slice(1)
  // keep only digits
  s = s.replace(/\D/g, '')
  return s
}

function isValidPhone(cleaned: string) {
  return cleaned.length >= 10
}

export function CommunicationHub({ user, compact = false, currentUserId }: { user: UserLike, compact?: boolean, currentUserId?: string }) {
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetError, setMeetError] = useState<string | null>(null)
  const [meetDemo, setMeetDemo] = useState(false)
  const [copied, setCopied] = useState(false)

  // don't show for own profile
  if (currentUserId && user.id && currentUserId === user.id) return null

  const cleaned = cleanPhone(user.phone)
  const validPhone = isValidPhone(cleaned)
  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Employee'

  const handleInstantMeet = async () => {
    setMeetLoading(true)
    setMeetError(null)
    try {
      const { data } = await api.post('/meetings/instant', { attendee_id: user.id })
      if (data?.meet_link || data?.link || data?.url) {
        const link = data.meet_link || data.link || data.url
        setMeetLink(link)
        setMeetDemo(data.source === 'mock')
        window.open(link, '_blank')
      } else {
        setMeetError('Could not create meeting link')
      }
    } catch (ex: any) {
      setMeetError(ex.response?.data?.detail || 'Failed to create Meet link')
    } finally {
      setMeetLoading(false)
    }
  }

  const copy = async () => {
    if (!meetLink) return
    await navigator.clipboard.writeText(meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.preventDefault()}>
        <a
          href={validPhone ? `tel:+91${cleaned}` : undefined}
          onClick={e => { if (!validPhone) e.preventDefault() }}
          title={validPhone ? `Call ${displayName} • +91 ${cleaned}` : 'No phone number'}
          className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${validPhone ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'}`}
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
        <a
          href={validPhone ? `https://wa.me/91${cleaned}` : undefined}
          target={validPhone ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={e => { if (!validPhone) e.preventDefault() }}
          title={validPhone ? `WhatsApp ${displayName}` : 'No phone number'}
          className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${validPhone ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'}`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
        <a
          href={user.email ? `mailto:${user.email}` : undefined}
          onClick={e => { if (!user.email) e.preventDefault() }}
          title={user.email ? `Email ${displayName}` : 'No email'}
          className="h-7 w-7 rounded-full flex items-center justify-center border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-600 transition"
        >
          <Mail className="h-3.5 w-3.5" />
        </a>
        <button
          onClick={handleInstantMeet}
          disabled={meetLoading}
          title="Start instant Google Meet"
          className="h-7 w-7 rounded-full flex items-center justify-center border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-600 transition disabled:opacity-50"
        >
          <Video className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // Full mode - 2x2 grid
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={validPhone ? `tel:+91${cleaned}` : undefined}
          onClick={e => { if (!validPhone) e.preventDefault() }}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${validPhone ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'}`}
        >
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${validPhone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
            <Phone className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-none">Call</span>
            <span className="block text-xs text-zinc-500 truncate">{validPhone ? `+91 ${cleaned}` : 'No phone number'}</span>
          </span>
        </a>

        <a
          href={validPhone ? `https://wa.me/91${cleaned}` : undefined}
          target={validPhone ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={e => { if (!validPhone) e.preventDefault() }}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${validPhone ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/10' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'}`}
        >
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${validPhone ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-none">WhatsApp</span>
            <span className="block text-xs text-zinc-500 truncate">{validPhone ? `Chat ${user.first_name || ''}` : 'No phone number'}</span>
          </span>
        </a>

        <a
          href={user.email ? `mailto:${user.email}` : undefined}
          className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 text-left transition"
        >
          <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
            <Mail className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-none">Email</span>
            <span className="block text-xs text-zinc-500 truncate">{user.email || '—'}</span>
          </span>
        </a>

        <button
          onClick={handleInstantMeet}
          disabled={meetLoading}
          className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 text-left transition disabled:opacity-50"
        >
          <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
            <Video className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-none">{meetLoading ? 'Creating…' : 'Google Meet'}</span>
            <span className="block text-xs text-zinc-500 truncate">{meetLoading ? 'Please wait' : 'Start instant call'}</span>
          </span>
        </button>
      </div>

      {meetError && (
        <div className="text-xs p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">{meetError}</div>
      )}

      {meetLink && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <span className="flex-1 text-xs font-mono truncate text-violet-700 dark:text-violet-300">{meetLink}</span>
            <button onClick={copy} className="h-7 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 flex items-center gap-1.5 text-xs font-medium hover:bg-violet-100 dark:hover:bg-zinc-800 transition shrink-0">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a href={meetLink} target="_blank" rel="noopener noreferrer" className="h-7 px-2.5 rounded-lg bg-violet-600 text-white flex items-center text-xs font-medium hover:bg-violet-700 transition shrink-0">Join</a>
          </div>
          {meetDemo && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">Demo link — Google Calendar API is not configured on the server, so this Meet code won't work.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CommunicationHub
