import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Microscope, Brain, MessageSquare,
  CalendarDays, ShoppingBag, Settings, LogOut, Menu, X, Leaf, Map
} from 'lucide-react'

const nav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/diagnose',    icon: Microscope,       label: 'Diagnose' },
  { to: '/cropmind',    icon: Brain,            label: 'CropMind' },
  { to: '/assistant',   icon: MessageSquare,    label: 'Assistant' },
  { to: '/timeline',    icon: CalendarDays,     label: 'Timeline' },
  { to: '/marketplace', icon: ShoppingBag,      label: 'Marketplace' },
  { to: '/settings',    icon: Settings,         label: 'Settings' },
  { to: '/map',         icon: Map,              label: 'Farm Map' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-forest-light/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-earth flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display text-lg text-white">CropVet<span className="text-forest-light">AI</span></span>
        </div>
        <p className="text-xs text-forest-light mt-1 font-body">The Farm's Own AI Brain</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all
               ${isActive
                 ? 'bg-forest-light/20 text-white'
                 : 'text-forest-light/70 hover:text-white hover:bg-white/5'}`
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-forest-light/60 hover:text-white hover:bg-white/5 w-full transition-all">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-forest-dark shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-forest-dark flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-forest-dark text-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-earth flex items-center justify-center">
              <Leaf size={12} className="text-white" />
            </div>
            <span className="font-display text-base text-white">CropVet<span className="text-forest-light">AI</span></span>
          </div>
          <button onClick={() => setOpen(true)} className="p-1">
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl w-full mx-auto fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
