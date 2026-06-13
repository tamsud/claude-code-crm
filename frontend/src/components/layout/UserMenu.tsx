import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, UserCircle, LogOut, Settings, KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  sales_rep: 'Sales Rep',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  sales_rep: 'bg-green-100 text-green-700',
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const role = user?.role ?? 'sales_rep'
  const initials = (user?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()
  const displayName = user?.displayName ?? user?.email ?? 'User'
  const email = user?.email ?? ''

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  function handleSignOut() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-[120px]">
          {displayName}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1"
        >
          {/* User identity header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
              <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              role="menuitem"
              onClick={() => go('/profile')}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserCircle className="h-4 w-4 text-slate-400" />
              Profile Settings
            </button>
            <button
              role="menuitem"
              onClick={() => go('/profile?tab=password')}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-slate-400" />
              Change Password
            </button>
            <button
              role="menuitem"
              onClick={() => go('/settings')}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </button>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
