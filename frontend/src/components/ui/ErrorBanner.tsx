import { AlertCircle, RefreshCw, X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-300 hover:text-red-500 transition-colors">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

