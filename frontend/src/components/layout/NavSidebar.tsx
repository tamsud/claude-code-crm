import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, Target, TrendingUp,
  Activity, Mail, Database, UserCog,
  ChevronLeft, ChevronRight, Menu,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const mainLinks = [
  { to: '/',               label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',       label: 'Accounts',     icon: Building2 },
  { to: '/contacts',       label: 'Contacts',     icon: Users },
  { to: '/leads',          label: 'Leads',        icon: Target },
  { to: '/opportunities',  label: 'Pipeline',     icon: TrendingUp },
  { to: '/activities',     label: 'Activities',   icon: Activity },
]

function NavItem({
  to, label, icon: Icon, end, collapsed,
}: {
  to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-indigo-100/80 hover:bg-indigo-700 hover:text-white'
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

interface NavSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function NavSidebar({ mobileOpen = false, onMobileClose }: NavSidebarProps) {
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem('crm-sidebar-collapsed') === '1'
  )

  const role = user?.role ?? 'sales_rep'
  const isAdmin = role === 'admin'

  const adminLinks = [
    { to: '/admin/users',      label: 'Users',        icon: UserCog,   adminOnly: true },
    { to: '/admin/mock-email', label: 'Mock Email',   icon: Mail,      adminOnly: false },
    { to: '/admin/seed',       label: 'Seed Manager', icon: Database,  adminOnly: true },
  ].filter((l) => !l.adminOnly || isAdmin)

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('crm-sidebar-collapsed', next ? '1' : '0')
  }

  const effectiveCollapsed = collapsed && !isMobile

  const sidebarClasses = cn(
    'relative flex flex-col bg-indigo-900 px-3 py-4 transition-all duration-200',
    // Desktop sizing
    !isMobile && (effectiveCollapsed ? 'w-16' : 'w-60'),
    // Mobile: fixed drawer
    isMobile && 'fixed inset-y-0 left-0 z-50 w-60 shadow-2xl',
    isMobile && (mobileOpen ? 'translate-x-0' : '-translate-x-full'),
    isMobile && 'transition-transform duration-200',
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className={cn('mb-4 px-1 flex items-center', effectiveCollapsed ? 'justify-center' : 'gap-2')}>
          {!effectiveCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                  <rect x="2" y="14" width="5" height="7" rx="1" />
                  <rect x="9.5" y="9" width="5" height="12" rx="1" />
                  <rect x="17" y="4" width="5" height="17" rx="1" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">Sales CRM</h1>
              </div>
            </>
          )}
          {effectiveCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                <rect x="2" y="14" width="5" height="7" rx="1" />
                <rect x="9.5" y="9" width="5" height="12" rx="1" />
                <rect x="17" y="4" width="5" height="17" rx="1" />
              </svg>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {mainLinks.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} end={to === '/'} collapsed={effectiveCollapsed} />
          ))}
          <div className="my-2 border-t border-indigo-700" />
          {!effectiveCollapsed && (
            <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Admin</p>
          )}
          {adminLinks.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} collapsed={effectiveCollapsed} />
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white shadow-md hover:bg-indigo-600 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronLeft className="h-3 w-3" />
            }
          </button>
        )}
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}