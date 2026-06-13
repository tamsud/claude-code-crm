import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import type { AccountCreate } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SortFilterBar } from '@/components/ui/SortFilterBar'
import { useSortFilter } from '@/hooks/useSortFilter'
import { useAuth } from '@/contexts/AuthContext'
import { AccountForm } from './AccountForm'

const PAGE_SIZE = 20
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'industry', label: 'Industry' },
  { value: 'updated_at', label: 'Last Updated' },
]

export function AccountsListPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const sf = useSortFilter()

  const params = { page, size: PAGE_SIZE, ...sf.toParams() }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.accounts.list(params),
    queryFn: () => accountsApi.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (body: AccountCreate) => accountsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
      toast.success('Account created')
      setShowCreate(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canCreate = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Account
          </Button>
        )}
      </div>

      <SortFilterBar state={sf} sortOptions={SORT_OPTIONS} placeholder="Search accounts…" />

      {error && (
        <ErrorBanner
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          title="No accounts found"
          description={sf.search ? `No accounts matching "${sf.search}"` : 'Create your first account to get started'}
          action={canCreate ? { label: 'New Account', onClick: () => setShowCreate(true) } : undefined}
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Industry</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Website</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      <Link to={`/accounts/${a.id}`}>{a.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.website ? (
                        <a href={a.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          {a.website}
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}

      <Modal open={showCreate} onOpenChange={setShowCreate} title="New Account">
        <AccountForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
