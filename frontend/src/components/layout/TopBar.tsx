import { Menu } from 'lucide-react'
import { UserMenu } from './UserMenu'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header
      className="h-12 bg-white border-b border-slate-100 flex items-center px-4 gap-3 flex-shrink-0 shadow-xs"
      role="banner"
      aria-label="Top bar"
    >
      <button
        onClick={onMenuClick}
        className="md:hidden inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  )
}
