import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { emailApi } from '@/api/email'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/utils/formatters'

export function EmailDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: email, isLoading, error } = useQuery({
    queryKey: queryKeys.emails.detail(id!),
    queryFn: () => emailApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner className="m-8" />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!email) return null

  return (
    <div className="p-6 max-w-3xl">
      <Link
        to="/admin/mock-email"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Inbox
      </Link>

      <div className="rounded-lg border border-slate-100 bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">{email.subject}</h1>
        <div className="space-y-1 text-sm text-slate-500">
          <p><span className="font-medium text-slate-700">From:</span> {email.from_email}</p>
          <p><span className="font-medium text-slate-700">To:</span> {email.to_email}</p>
          <p><span className="font-medium text-slate-700">Sent:</span> {formatDate(email.sent_at)}</p>
        </div>
        <hr className="border-slate-100" />
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {email.body ?? email.html_body ?? '(no content)'}
        </div>
      </div>
    </div>
  )
}
