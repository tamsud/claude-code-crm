import { cn } from '@/utils/cn'

interface Tab<T extends string> {
  key: T
  label: string
  count?: number
}

interface TabStripProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (tab: T) => void
}

export function TabStrip<T extends string>({ tabs, active, onChange }: TabStripProps<T>) {
  return (
    <div className="border-b border-slate-100 bg-white">
      <nav className="-mb-px flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors',
              active === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  active === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
