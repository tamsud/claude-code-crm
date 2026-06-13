import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { emailApi } from '@/api/email'
import type { EmailSend } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate } from '@/utils/formatters'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { TableHead } from '@/components/ui/TableHead'
import { useSortFilter } from '@/hooks/useSortFilter'
import { ComposeEmailForm } from './ComposeEmailForm'

export function MockEmailPage() {
  usePageTitle('Mail Inbox')
  const qc = useQueryClient()
  const [showCompose, setShowCompose] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const confirm = useConfirmDialog()
  const sf = useSortFilter()

  const markRead = (id: string) => setReadIds((prev) => new Set([...prev, id]))

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

  const items = data?.items ?? []
  const filtered = sf.search
    ? items.filter(
        (em) =>
          em.subject.toLowerCase().includes(sf.search.toLowerCase()) ||
          em.from_email.toLowerCase().includes(sf.search.toLowerCase()) ||
          em.to_email.toLowerCase().includes(sf.search.toLowerCase())
      )
    : items

  return (
    <div className="p-4 space-y-3">
      <ListPageTitle title="Mail Inbox" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}

      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <TableHead
                columns={[
                  { label: 'Subject', field: 'subject' },
                  { label: 'From', field: 'from_email', noSort: true },
                  { label: 'To', field: 'to_email', noSort: true },
                  { label: 'Preview', field: 'body', noSort: true },
                  { label: 'Date', field: 'sent_at' },
                  { label: 'Status', field: 'status', noSort: true },
                ]}
                sf={sf}
                setPage={() => {}}
                search={sf.search}
                onSearch={(v) => sf.setSearch(v)}
                searchPlaceholder="Search inbox..."
                onAdd={() => setShowCompose(true)}
                addLabel="Compose"
                extra={
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    onClick={() => confirm.confirm('Clear all emails? This cannot be undone.')}
                  >
                    Clear
                  </Button>
                }
              />
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="Inbox is empty"
                        description={sf.search ? `No emails matching "${sf.search}"` : 'Compose an email or send one from a contact'}
                        action={{ label: 'Compose', onClick: () => setShowCompose(true) }}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((em) => {
                    const isRead = readIds.has(em.id)
                    return (
                    <tr
                      key={em.id}
                      className={`hover:bg-slate-50 transition-colors ${!isRead ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => markRead(em.id)}
                    >
                      <td className="px-4 py-3 font-medium max-w-[220px]">
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                          )}
                          <Link
                            to={`/admin/mock-email/${em.id}`}
                            className={`truncate block text-indigo-600 hover:underline ${!isRead ? 'font-semibold' : 'font-medium'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {em.subject}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{em.from_email}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden md:table-cell">{em.to_email}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[260px] hidden lg:table-cell">
                        <span className="truncate block text-xs">
                          {em.body ? em.body.replace(/<[^>]+>/g, '').slice(0, 80) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {formatRelativeDate(em.sent_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isRead ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                            Unread
                          </span>
                        )}
                      </td>
                      <td />
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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