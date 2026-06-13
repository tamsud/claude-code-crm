import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { contactsApi } from '@/api/contacts'
import type { ContactCreate } from '@/types/api'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableHead } from '@/components/ui/TableHead'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { useSortFilter } from '@/hooks/useSortFilter'
import { useAuth } from '@/contexts/AuthContext'
import { ContactForm } from './ContactForm'

const PAGE_SIZE = 20

export function ContactsListPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const sf = useSortFilter()

  const params = { page, size: PAGE_SIZE, ...sf.toParams() }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => contactsApi.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (body: ContactCreate) => contactsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Contact created')
      setShowCreate(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canCreate = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="p-4 space-y-3">
      <ListPageTitle title="Contacts" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <TableHead
                columns={[
                  { label: 'Name', field: 'first_name' },
                  { label: 'Email', field: 'email' },
                  { label: 'Job Title', field: 'job_title' },
                  { label: 'Phone', field: 'phone', noSort: true },
                ]}
                sf={sf}
                setPage={setPage}
                search={sf.search}
                onSearch={(v) => { sf.setSearch(v); setPage(1) }}
                searchPlaceholder="Search contacts..."
                onAdd={canCreate ? () => setShowCreate(true) : undefined}
                addLabel="New Contact"
              />
              <tbody className="divide-y divide-slate-100">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No contacts found"
                        description={sf.search ? `No contacts matching "${sf.search}"` : 'Create your first contact'}
                        action={canCreate ? { label: 'New Contact', onClick: () => setShowCreate(true) } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  data?.items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-600">
                        <Link to={`/contacts/${c.id}`}>{c.first_name} {c.last_name}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.email}</td>
                      <td className="px-4 py-3 text-slate-600">{c.job_title ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                      <td />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && data.total != null && data.total > PAGE_SIZE && (
        <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
      <Modal open={showCreate} onOpenChange={setShowCreate} title="New Contact">
        <ContactForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}