import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { emailApi } from '@/api/email'
import type { EmailSend } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate } from '@/utils/formatters'
import { ComposeEmailForm } from './ComposeEmailForm'

export function MockEmailPage() {
  const qc = useQueryClient()
  const [showCompose, setShowCompose] = useState(false)
  const confirm = useConfirmDialog()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.emails.list({}),
    queryFn: () => emailApi.list({}),
  })

  const sendMutation = useMutation({
    mutationFn: (body: EmailSend) => emailApi.send(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emails.lists() })
      toast.success('Email sent')
      setShowCompose(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const clearMutation = useMutation({
    mutationFn: () => emailApi.clearAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emails.lists() })
      toast.success('Inbox cleared')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mock Email Inbox</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-1" /> Compose
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => confirm.confirm('Clear all emails? This cannot be undone.')}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear Inbox
          </Button>
        </div>
      </div>

      {error && (
        <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          title="Inbox is empty"
          description="Compose an email or send one from a contact"
          action={{ label: 'Compose', onClick: () => setShowCompose(true) }}
        />
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {data.items.map((em) => (
            <Link
              key={em.id}
              to={`/admin/mock-email/${em.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{em.subject}</p>
                <p className="text-xs text-gray-500">To: {em.to_email}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatRelativeDate(em.sent_at)}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCompose} onOpenChange={setShowCompose} title="Compose Email">
        <ComposeEmailForm
          onSubmit={(body) => sendMutation.mutate(body)}
          onCancel={() => setShowCompose(false)}
          loading={sendMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.isOpen}
        message={confirm.message}
        onConfirm={() => { confirm.handleConfirm(); clearMutation.mutate() }}
        onCancel={confirm.handleCancel}
      />
    </div>
  )
}
