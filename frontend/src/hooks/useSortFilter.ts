import { useCallback, useState } from 'react'

export interface SortFilterState {
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export interface UseSortFilterReturn extends SortFilterState {
  setSearch: (s: string) => void
  setSortBy: (s: string) => void
  setSortDir: (d: 'asc' | 'desc') => void
  toggleSortDir: () => void
  reset: () => void
  toParams: () => Record<string, string>
}

export function useSortFilter(defaults: Partial<SortFilterState> = {}): UseSortFilterReturn {
  const [search, setSearch] = useState(defaults.search ?? '')
  const [sortBy, setSortBy] = useState(defaults.sortBy ?? 'created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaults.sortDir ?? 'desc')

  const toggleSortDir = useCallback(() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')), [])

  const reset = useCallback(() => {
    setSearch(defaults.search ?? '')
    setSortBy(defaults.sortBy ?? 'created_at')
    setSortDir(defaults.sortDir ?? 'desc')
  }, [defaults.search, defaults.sortBy, defaults.sortDir])

  const toParams = useCallback((): Record<string, string> => {
    const p: Record<string, string> = { sort_by: sortBy, sort_dir: sortDir }
    if (search.trim()) p['search'] = search.trim()
    return p
  }, [search, sortBy, sortDir])

  return { search, setSearch, sortBy, setSortBy, sortDir, setSortDir, toggleSortDir, reset, toParams }
}
