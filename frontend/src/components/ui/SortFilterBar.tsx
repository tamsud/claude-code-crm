import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Search, X } from 'lucide-react'
import type { UseSortFilterReturn } from '@/hooks/useSortFilter'

interface SortOption {
  value: string
  label: string
}

interface SortFilterBarProps {
  state: UseSortFilterReturn
  sortOptions: SortOption[]
  placeholder?: string
  className?: string
}

export function SortFilterBar({ state, sortOptions, placeholder = 'Search…', className = '' }: SortFilterBarProps) {
  const { search, setSearch, sortBy, setSortBy, sortDir, toggleSortDir, reset } = state
  const isDirty = search !== '' || sortBy !== 'created_at' || sortDir !== 'desc'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort'

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border-0 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Sort-by dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-600 font-medium transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          {currentLabel}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-dropdown border border-slate-100 py-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  sortBy === opt.value
                    ? 'text-indigo-600 bg-indigo-50 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Asc/Desc toggle */}
      <button
        onClick={toggleSortDir}
        title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-600 transition-colors"
      >
        {sortDir === 'asc'
          ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
          : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />}
        <span className="text-xs font-medium">{sortDir === 'asc' ? 'Asc' : 'Desc'}</span>
      </button>

      {/* Reset — only when dirty */}
      {isDirty && (
        <button
          onClick={reset}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  )
}
