import { AlertCircle, RefreshCw, X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 p-4">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
