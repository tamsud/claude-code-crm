import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { contactsApi } from '@/api/contacts'
import { opportunitiesApi } from '@/api/opportunities'
import type { AccountCreate } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { DetailCard, FieldRow } from '@/components/ui/DetailCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { AccountForm } from './AccountForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/utils/formatters'

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const confirm = useConfirmDialog()

  const { data: account, isLoading, error } = useQuery({
    queryKey: queryKeys.accounts.detail(id!),
    queryFn: () => accountsApi.get(id!),
    enabled: !!id,
  })

  const contacts = useQuery({
    queryKey: queryKeys.contacts.list({ account_id: id }),
    queryFn: () => contactsApi.list({ account_id: id, size: 100 }),
    enabled: !!id,
  })

  const opportunities = useQuery({
    queryKey: queryKeys.opportunities.list({ account_id: id }),
    queryFn: () => opportunitiesApi.list({ account_id: id, size: 100 }),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: AccountCreate) => accountsApi.update(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.detail(id!) })
      toast.success('Account updated')
      setShowEdit(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => accountsApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
      toast.success('Account deleted')
      navigate('/accounts')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <SkeletonText className="h-8 w-56" />
      <SkeletonText className="h-4 w-40" />
    </div>
  )
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!account) return null

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={account.name}
        breadcrumb={{ label: 'Accounts', to: '/accounts' }}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => confirm.confirm(`Delete "${account.name}"? This cannot be undone.`)}>Delete</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DetailCard title="Account Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <FieldRow label="Industry" value={account.industry ?? '—'} />
              <FieldRow label="Website" value={account.website ? <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{account.website}</a> : '—'} />
            </div>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title="Contacts">
            <div className="space-y-2">
              {contacts.data?.items.map((c) => (
                <Link key={c.id} to={`/contacts/${c.id}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:text-indigo-600 transition-colors">
                  <span className="text-sm font-medium text-slate-900">{c.first_name} {c.last_name}</span>
                  <span className="text-xs text-slate-400">{c.email}</span>
                </Link>
              ))}
              {!contacts.isLoading && contacts.data?.items.length === 0 && <p className="text-sm text-slate-400">No contacts linked.</p>}
            </div>
          </DetailCard>

          <DetailCard title="Opportunities">
            <div className="space-y-2">
              {opportunities.data?.items.map((o) => (
                <Link key={o.id} to={`/opportunities/${o.id}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:text-indigo-600 transition-colors">
                  <span className="text-sm font-medium text-slate-900">{o.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="stage" value={o.stage} />
                    <span className="text-xs text-slate-500">{formatCurrency(o.value ?? 0)}</span>
                  </div>
                </Link>
              ))}
              {!opportunities.isLoading && opportunities.data?.items.length === 0 && <p className="text-sm text-slate-400">No opportunities linked.</p>}
            </div>
          </DetailCard>
        </div>
      </div>

      <Modal open={showEdit} onOpenChange={setShowEdit} title="Edit Account">
        <AccountForm
          defaultValues={{
            name: account.name,
            industry: account.industry ?? undefined,
            website: account.website ?? undefined,
          }}
          onSubmit={(body) => updateMutation.mutate(body)}
          onCancel={() => setShowEdit(false)}
          loading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.isOpen}
        message={confirm.message}
        onConfirm={() => { confirm.handleConfirm(); deleteMutation.mutate() }}
        onCancel={confirm.handleCancel}
      />
    </div>
  )
}
