import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Verify from './pages/Verify'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Profile from './pages/Profile'
import Attendance from './pages/Attendance'
import TimeOff from './pages/TimeOff'
import Reports from './pages/Reports'
import Payroll from './pages/Payroll'
import Settings from './pages/Settings'
import Documents from './pages/Documents'
import Notifications from './pages/Notifications'
import Company from './pages/Company'
import Meetings from './pages/Meetings'
import Interns from './pages/Interns'
import About from './pages/About'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import HelpCenter from './pages/HelpCenter'
import GettingStarted from './pages/GettingStarted'
import Support from './pages/Support'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui/toast'
import { useAuth } from './stores/auth'

const qc = new QueryClient()

function ThemeInit(){
  // ensure saved theme is applied even on pages without ThemeToggle
  // (Landing is white-only visually, but underlying html class still dictates app theme)
  if(typeof window !== 'undefined'){
    const saved = localStorage.getItem('dailyflow-theme')
    if(saved === 'dark') document.documentElement.classList.add('dark')
    else if(saved === 'light') document.documentElement.classList.remove('dark')
  }
  return null
}

function Protected({children}:{children:React.ReactNode}){
  const { token } = useAuth()
  if(!token) return <Navigate to="/login" replace/>
  return <>{children}</>
}

export default function App(){
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
      <ThemeInit/>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/verify" element={<Verify/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/privacy" element={<Privacy/>}/>
          <Route path="/terms" element={<Terms/>}/>
          <Route path="/help" element={<HelpCenter/>}/>
          <Route path="/getting-started" element={<GettingStarted/>}/>
          <Route path="/support" element={<Support/>}/>
          <Route element={<Protected><Layout/></Protected>}>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/employees" element={<Employees/>}/>
            <Route path="/profile/:id" element={<Profile/>}/>
            <Route path="/me" element={<Profile/>}/>
            <Route path="/attendance" element={<Attendance/>}/>
            <Route path="/time-off" element={<TimeOff/>}/>
            <Route path="/payroll" element={<Payroll/>}/>
            <Route path="/reports" element={<Reports/>}/>
            <Route path="/documents" element={<Documents/>}/>
            <Route path="/notifications" element={<Notifications/>}/>
            <Route path="/company" element={<Company/>}/>
            <Route path="/meetings" element={<Meetings/>}/>
            <Route path="/interns" element={<Interns/>}/>
            <Route path="/settings" element={<Settings/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
