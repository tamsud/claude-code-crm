import { useRef, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { UseSortFilterReturn } from '@/hooks/useSortFilter'

export interface ColDef {
  label: string
  field: string
  noSort?: boolean
}

interface TableHeadProps {
  columns: ColDef[]
  sf: UseSortFilterReturn
  setPage: (p: number) => void
  /** Search */
  search: string
  onSearch: (v: string) => void
  searchPlaceholder?: string
  /** Add action */
  onAdd?: () => void
  addLabel?: string
  /** Optional tab filters rendered as a thin row above column headers */
  tabs?: { key: string; label: string }[]
  activeTab?: string
  onTabChange?: (key: string) => void
  /** Extra elements rendered in the actions cell (e.g. view toggles) */
  extra?: React.ReactNode
}

/**
 * A <thead> element that contains:
 * 1. (optional) a tab-filter row spanning all columns
 * 2. Column header row where the last cell holds: [search] [extra] [add]
 *
 * Usage: drop directly inside a <table> instead of writing your own <thead>.
 */
export function TableHead({
  columns,
  sf,
  setPage,
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  onAdd,
  addLabel = 'New',
  tabs,
  activeTab,
  onTabChange,
  extra,
}: TableHeadProps) {
  const [searchOpen, setSearchOpen] = useState(!!search)
  const inputRef = useRef<HTMLInputElement>(null)
  const totalCols = columns.length + 1 // +1 for actions column

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
    <thead className="bg-slate-50">
      {/* ── Tab filter row (optional) ── */}
      {tabs && tabs.length > 0 && (
        <tr>
          <th
            colSpan={totalCols}
            className="px-3 pt-2 pb-0 border-b-0"
          >
            <div className="flex items-center gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { onTabChange?.(tab.key); setPage(1) }}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </th>
        </tr>
      )}

      {/* ── Column headers + actions ── */}
      <tr className="border-b border-slate-100">
        {columns.map((col, idx) => {
          const isFirst = idx === 0

          // First column: search icon pinned to right edge of the cell
          const searchWidget = isFirst ? (
            searchOpen ? (
              <div className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 shadow-xs">
                <Search className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => { onSearch(e.target.value); setPage(1) }}
                  onBlur={handleBlur}
                  placeholder={searchPlaceholder}
                  className="w-32 text-xs bg-transparent outline-none placeholder:text-slate-400 text-slate-700 font-normal normal-case tracking-normal"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); clearSearch() }}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); openSearch() }}
                title="Search"
                className={cn(
                  'p-1 rounded-md transition-colors',
                  search
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                )}
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )
          ) : null

          if (col.noSort) {
            return (
              <th
                key={col.field}
                className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{col.label}</span>
                  {searchWidget}
                </span>
              </th>
            )
          }
          const active = sf.sortBy === col.field
          return (
            <th
              key={col.field}
              className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 group"
              onClick={() => {
                if (active) sf.toggleSortDir()
                else { sf.setSortBy(col.field); sf.setSortDir('asc') }
                setPage(1)
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  {col.label}
                  <span className={active ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'}>
                    {active
                      ? (sf.sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                      : <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </span>
                {searchWidget}
              </span>
            </th>
          )
        })}

        {/* ── Actions cell ── */}
        <th className="px-3 py-2.5 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1 justify-end">
            {/* Extra (e.g. view toggles, clear) */}
            {extra && (
              <>
                {extra}
                {onAdd && <div className="w-px h-4 bg-slate-200 mx-0.5" />}
              </>
            )}

            {/* Separator + Add button */}
            {onAdd && (
              <>
                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                <button
                  onClick={onAdd}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  {addLabel}
                </button>
              </>
            )}
          </div>
        </th>
      </tr>
    </thead>
  )
}