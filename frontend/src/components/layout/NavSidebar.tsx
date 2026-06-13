import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, Target, TrendingUp,
  Activity, Mail, Database, UserCog, LogOut, UserCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

const mainLinks = [
  { to: '/',               label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',       label: 'Accounts',     icon: Building2 },
  { to: '/contacts',       label: 'Contacts',     icon: Users },
  { to: '/leads',          label: 'Leads',        icon: Target },
  { to: '/opportunities',  label: 'Pipeline',     icon: TrendingUp },
  { to: '/activities',     label: 'Activities',   icon: Activity },
]

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

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-indigo-100/80 hover:bg-indigo-700 hover:text-white'
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  )
}

export function NavSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role ?? 'sales_rep'
  const isAdmin = role === 'admin'

  const adminLinks = [
    { to: '/admin/mock-email', label: 'Mock Email', icon: Mail },
    { to: '/admin/seed',       label: 'Seed Manager', icon: Database, adminOnly: true },
    { to: '/admin/users',      label: 'Users', icon: UserCog, adminOnly: true },
  ].filter((l) => !l.adminOnly || isAdmin)

  return (
    <aside className="flex h-screen w-60 flex-col bg-indigo-900 px-3 py-4">
      <div className="mb-6 px-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-400 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-none">Sales CRM</h1>
          <p className="text-indigo-300 text-xs">Platform</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {mainLinks.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} end={to === '/'} />
        ))}
        <div className="my-2 border-t border-indigo-700" />
        <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Admin</p>
        {adminLinks.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}
      </nav>

      <div
        onClick={() => navigate('/profile')}
        className="mt-auto mx-0 p-3 rounded-lg cursor-pointer hover:bg-indigo-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {(user?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.displayName ?? user?.email}
            </p>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
          <UserCircle className="w-4 h-4 text-indigo-300 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); logout(); navigate('/login') }}
          className="mt-2 flex items-center gap-2 text-xs text-indigo-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-3 h-3" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
