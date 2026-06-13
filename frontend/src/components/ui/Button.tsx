import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'

const variantClasses = {
  primary:     'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs disabled:bg-indigo-300 disabled:cursor-not-allowed',
  secondary:   'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs disabled:bg-red-300 disabled:cursor-not-allowed',
  ghost:       'text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed',
  success:     'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs disabled:bg-emerald-300 disabled:cursor-not-allowed',
}

const sizeClasses = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
  loading?: boolean
  icon?: LucideIcon
  children?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  )
}