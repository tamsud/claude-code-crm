import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Phone, Building2 } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { contactsApi } from '@/api/contacts'
import { activitiesApi } from '@/api/activities'
import { emailApi } from '@/api/email'
import type { ContactCreate } from '@/types/api'
import { DetailHeader } from '@/components/layout/DetailHeader'
import { ProfileSidebar } from '@/components/layout/ProfileSidebar'
import { TabStrip } from '@/components/layout/TabStrip'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { ContactForm } from './ContactForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate, formatDate } from '@/utils/formatters'

type Tab = 'overview' | 'history' | 'emails'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showEdit, setShowEdit] = useState(false)
  const confirm = useConfirmDialog()

  const { data: contact, isLoading, error } = useQuery({
    queryKey: queryKeys.contacts.detail(id!),
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
  })

  const activities = useQuery({
    queryKey: queryKeys.activities.list({ contact_id: id }),
    queryFn: () => activitiesApi.list({ contact_id: id, size: 50 }),
    enabled: !!id,
  })

  const emails = useQuery({
    queryKey: queryKeys.emails.list({ to: contact?.email }),
    queryFn: () => emailApi.list({ to: contact?.email }),
    enabled: !!contact?.email && tab === 'emails',
  })

  const updateMutation = useMutation({
    mutationFn: (body: ContactCreate) => contactsApi.update(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.detail(id!) })
      toast.success('Contact updated')
      setShowEdit(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => contactsApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Contact deleted')
      navigate('/contacts')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <LoadingSpinner className="m-8" />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!contact) return null

  const sidebarFields = [
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    ...(contact.phone ? [{ icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone}` }] : []),
    ...(contact.account_id
      ? [{ icon: Building2, label: 'Account', value: contact.account_id, href: `/accounts/${contact.account_id}` }]
      : []),
  ]

  return (
    <div>
      <DetailHeader
        backTo="/contacts"
        backLabel="Contacts"
        title={`${contact.first_name} ${contact.last_name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirm.confirm('Delete this contact? This cannot be undone.')}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 p-6">
        <ProfileSidebar
          name={`${contact.first_name} ${contact.last_name}`}
          avatarColor="bg-emerald-600"
          fields={sidebarFields}
        />

        <div className="flex-1 min-w-0">
          <TabStrip<Tab>
            tabs={[
              { key: 'overview', label: 'Overview' },
              { key: 'history', label: 'History' },
              { key: 'emails', label: 'Emails' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'overview' && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500">
                {activities.data?.total ?? 0} activities logged
              </p>
              {activities.data?.items.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <Badge variant="activity" value={a.type} />
                  <span className="text-gray-700">{a.subject}</span>
                  <span className="ml-auto text-gray-400 text-xs">
                    {a.activity_date ? formatRelativeDate(a.activity_date) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="mt-4 space-y-3">
              {activities.isLoading && <LoadingSpinner />}
              {activities.data?.items.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="activity" value={a.type} />
                    <span className="font-medium text-gray-900">{a.subject}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {a.activity_date ? formatDate(a.activity_date) : '—'}
                    </span>
                  </div>
                  {a.notes && <p className="text-gray-600">{a.notes}</p>}
                </div>
              ))}
              {!activities.isLoading && activities.data?.items.length === 0 && (
                <p className="text-sm text-gray-400">No activity history yet.</p>
              )}
            </div>
          )}

          {tab === 'emails' && (
            <div className="mt-4 space-y-3">
              {emails.isLoading && <LoadingSpinner />}
              {emails.data?.items.map((em) => (
                <Link
                  key={em.id}
                  to={`/admin/mock-email/${em.id}`}
                  className="block rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{em.subject}</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(em.sent_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">To: {em.to_email}</p>
                </Link>
              ))}
              {!emails.isLoading && emails.data?.items.length === 0 && (
                <p className="text-sm text-gray-400">No emails found for {contact.email}.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showEdit} onOpenChange={setShowEdit} title="Edit Contact">
        <ContactForm
          defaultValues={{
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone ?? undefined,
            account_id: contact.account_id ?? undefined,
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
