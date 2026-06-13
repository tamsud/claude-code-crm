import { useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface TabItem {
  key: string
  label: string
}

interface TableToolbarProps {
  /** Expandable search */
  search: string
  onSearch: (value: string) => void
  searchPlaceholder?: string
  /** Primary create action */
  onAdd?: () => void
  addLabel?: string
  /** Tab filters rendered on the left */
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (key: string) => void
  /** Extra icon-buttons rendered right of search (e.g. view toggle) */
  extra?: React.ReactNode
  className?: string
}

/**
 * Compact table header toolbar.
 * Search is hidden by default — click the magnifier icon to expand it inline.
 * Tabs (if provided) appear on the left side.
 */
export function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  onAdd,
  addLabel = 'New',
  tabs,
  activeTab,
  onTabChange,
  extra,
  className,
}: TableToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(!!search)
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = () => {
    setSearchOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleBlur = () => {
    if (!search) setSearchOpen(false)
  }

  const clearSearch = () => {
    onSearch('')
    setSearchOpen(false)
  }

  return (
    <div className={cn('flex items-center gap-1 px-3 py-2', className)}>
      {/* Left: tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-0.5 mr-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: expandable search */}
      <div className="flex items-center">
        {searchOpen ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 w-48 transition-all">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={handleBlur}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-0 text-xs bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
            />
            {search ? (
              <button
                onMouseDown={(e) => { e.preventDefault(); clearSearch() }}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <button
                onMouseDown={(e) => { e.preventDefault(); setSearchOpen(false) }}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={openSearch}
            title="Search"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              search
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            )}
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Extra actions (e.g. view toggle) */}
      {extra}

      {/* Divider */}
      {onAdd && <div className="w-px h-4 bg-slate-200 mx-0.5" />}

      {/* Add button */}
      {onAdd && (
        <Button size="sm" icon={Plus} onClick={onAdd}>
          {addLabel}
        </Button>
      )}
    </div>
  )
}
