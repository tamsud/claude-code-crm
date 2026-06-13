import { cn } from '@/utils/cn'

interface SkeletonProps {
  count?: number
  className?: string
}

export function SkeletonText({ className }: SkeletonProps) {
  return (
    <div
      className={cn('h-4 w-full animate-pulse rounded bg-slate-200', className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonRow({ count = 5, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading…">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-white px-4 py-3 shadow-sm">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200 ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ count = 4, className }: SkeletonProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
      aria-busy="true"
      aria-label="Loading…"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-card bg-slate-200" />
      ))}
    </div>
  )
}
