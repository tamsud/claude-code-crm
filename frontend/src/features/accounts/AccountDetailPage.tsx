import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Globe, Building2 } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { contactsApi } from '@/api/contacts'
import { opportunitiesApi } from '@/api/opportunities'
import type { AccountCreate } from '@/types/api'
import { DetailHeader } from '@/components/layout/DetailHeader'
import { ProfileSidebar } from '@/components/layout/ProfileSidebar'
import { TabStrip } from '@/components/layout/TabStrip'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { AccountForm } from './AccountForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/utils/formatters'

type Tab = 'contacts' | 'opportunities'

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('contacts')
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

  if (isLoading) return <LoadingSpinner className="m-8" />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!account) return null

  const sidebarFields = [
    ...(account.website
      ? [{ icon: Globe, label: 'Website', value: account.website, href: account.website }]
      : []),
    ...(account.industry
      ? [{ icon: Building2, label: 'Industry', value: account.industry }]
      : []),
  ]

  return (
    <div>
      <DetailHeader
        backTo="/accounts"
        backLabel="Accounts"
        title={account.name}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                confirm.confirm(`Delete "${account.name}"? This cannot be undone.`)
              }
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 p-6">
        <ProfileSidebar
          name={account.name}
          avatarColor="bg-blue-600"
          fields={sidebarFields}
        />

        <div className="flex-1 min-w-0">
          <TabStrip<Tab>
            tabs={[
              { key: 'contacts', label: 'Contacts' },
              { key: 'opportunities', label: 'Opportunities' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'contacts' && (
            <div className="mt-4 space-y-2">
              {contacts.isLoading && <LoadingSpinner />}
              {contacts.data?.items.map((c) => (
                <Link
                  key={c.id}
                  to={`/contacts/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <span className="font-medium text-sm text-gray-900">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="text-sm text-gray-500">{c.email}</span>
                </Link>
              ))}
              {!contacts.isLoading && contacts.data?.items.length === 0 && (
                <p className="text-sm text-gray-400">No contacts linked.</p>
              )}
            </div>
          )}

          {tab === 'opportunities' && (
            <div className="mt-4 space-y-2">
              {opportunities.isLoading && <LoadingSpinner />}
              {opportunities.data?.items.map((o) => (
                <Link
                  key={o.id}
                  to={`/opportunities/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <span className="font-medium text-sm text-gray-900">{o.title}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="stage" value={o.stage} />
                    <span className="text-sm text-gray-600">
                      {formatCurrency(o.value ?? 0)}
                    </span>
                  </div>
                </Link>
              ))}
              {!opportunities.isLoading && opportunities.data?.items.length === 0 && (
                <p className="text-sm text-gray-400">No opportunities linked.</p>
              )}
            </div>
          )}
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
