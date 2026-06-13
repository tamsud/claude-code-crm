import { ArrowDown, ArrowUp, Search, X } from 'lucide-react'
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

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <button
        onClick={toggleSortDir}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {sortDir === 'asc' ? 'Asc' : 'Desc'}
      </button>

      {isDirty && (
        <button
          onClick={reset}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  )
}
