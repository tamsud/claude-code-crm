import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { contactsApi } from '@/api/contacts'
import type { ContactCreate } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SortFilterBar } from '@/components/ui/SortFilterBar'
import { useSortFilter } from '@/hooks/useSortFilter'
import { useAuth } from '@/contexts/AuthContext'
import { ContactForm } from './ContactForm'

const PAGE_SIZE = 20
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'updated_at', label: 'Last Updated' },
]

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Contact
          </Button>
        )}
      </div>

      <SortFilterBar state={sf} sortOptions={SORT_OPTIONS} placeholder="Search contacts…" />

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          title="No contacts found"
          description={sf.search ? `No contacts matching "${sf.search}"` : 'Create your first contact'}
          action={canCreate ? { label: 'New Contact', onClick: () => setShowCreate(true) } : undefined}
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Job Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      <Link to={`/contacts/${c.id}`}>{c.first_name} {c.last_name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.job_title ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
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
