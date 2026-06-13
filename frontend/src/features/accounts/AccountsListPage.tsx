import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import type { AccountCreate } from '@/types/api'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableHead } from '@/components/ui/TableHead'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { useSortFilter } from '@/hooks/useSortFilter'
import { useAuth } from '@/contexts/AuthContext'
import { AccountForm } from './AccountForm'

const PAGE_SIZE = 20

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
    <div className="p-4 space-y-3">
      <ListPageTitle title="Accounts" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <TableHead
                columns={[
                  { label: 'Name', field: 'name' },
                  { label: 'Industry', field: 'industry' },
                  { label: 'Website', field: 'website', noSort: true },
                ]}
                sf={sf}
                setPage={setPage}
                search={sf.search}
                onSearch={(v) => { sf.setSearch(v); setPage(1) }}
                searchPlaceholder="Search accounts..."
                onAdd={canCreate ? () => setShowCreate(true) : undefined}
                addLabel="New Account"
              />
              <tbody className="divide-y divide-slate-100">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        title="No accounts found"
                        description={sf.search ? `No accounts matching "${sf.search}"` : 'Create your first account to get started'}
                        action={canCreate ? { label: 'New Account', onClick: () => setShowCreate(true) } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  data?.items.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-600">
                        <Link to={`/accounts/${a.id}`}>{a.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{a.industry ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {a.website ? (
                          <a href={a.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            {a.website}
                          </a>
                        ) : '—'}
                      </td>
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