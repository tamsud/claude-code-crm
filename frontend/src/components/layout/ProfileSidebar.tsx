import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface SidebarField {
  icon: LucideIcon
  label: string
  value: string | null
  href?: string
}

interface ProfileSidebarProps {
  name: string
  initials?: string
  avatarColor?: string
  fields: SidebarField[]
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function ProfileSidebar({
  name,
  initials,
  avatarColor = 'bg-blue-600',
  fields,
}: ProfileSidebarProps) {
  const displayInitials = initials ?? computeInitials(name)

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white mb-3',
            avatarColor
          )}
        >
          {displayInitials}
        </div>
        <p className="font-semibold text-gray-900">{name}</p>
      </div>
      <div className="space-y-3">
        {fields.map(({ icon: Icon, label, value, href }) => {
          if (!value) return null
          return (
            <div key={label} className="flex items-start gap-2 text-sm">
              <Icon className="h-4 w-4 flex-shrink-0 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                {href ? (
                  href.startsWith('http') ? (
                    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                      {value}
                    </a>
                  ) : (
                    <Link to={href} className="text-blue-600 hover:underline">
                      {value}
                    </Link>
                  )
                ) : (
                  <p className="text-gray-700">{value}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
