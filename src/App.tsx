import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, CalendarCheck2, CalendarDays, Home, Settings, Users, DollarSign } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Schedule from './pages/Schedule'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import CalendarPage from './pages/Calendar'
import TithingPage from './pages/Tithing'
import Logo from './components/Logo'
import { useStore } from './store/store'

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => 
      `inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-800' : 'text-gray-600 hover:bg-gray-100'}`
    }>
      {icon}
      {label}
    </NavLink>
  )
}

export default function App() {
  const location = useLocation()
  const syncFromSupabase = useStore((s) => s.syncFromSupabase)
  useEffect(() => {
    syncFromSupabase().catch(() => {})
  }, [syncFromSupabase])
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Logo size={28} />
            Crew's Cuts
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem to="/" icon={<Home size={16} />} label="Dashboard" />
            <NavItem to="/clients" icon={<Users size={16} />} label="Clients" />
            <NavItem to="/schedule" icon={<CalendarCheck2 size={16} />} label="Schedule" />
            <NavItem to="/calendar" icon={<CalendarDays size={16} />} label="Calendar" />
            <NavItem to="/reports" icon={<BarChart3 size={16} />} label="Reports" />
            <NavItem to="/tithing" icon={<DollarSign size={16} />} label="Tithing" />
            <NavItem to="/settings" icon={<Settings size={16} />} label="Settings" />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tithing" element={<TithingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
