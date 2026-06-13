import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  noPadding?: boolean
}

export function Card({ children, className, onClick, noPadding }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-100 bg-white shadow-card',
        !noPadding && 'p-4',
        onClick && 'cursor-pointer hover:shadow-card-md transition-shadow duration-150',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

