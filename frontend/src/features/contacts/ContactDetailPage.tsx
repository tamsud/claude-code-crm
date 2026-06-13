import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { contactsApi } from '@/api/contacts'
import { activitiesApi } from '@/api/activities'
import { emailApi } from '@/api/email'
import type { ContactCreate } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { DetailCard, FieldRow } from '@/components/ui/DetailCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { ContactForm } from './ContactForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate, formatDate } from '@/utils/formatters'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
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
    enabled: !!contact?.email,
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

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <SkeletonText className="h-8 w-56" />
      <SkeletonText className="h-4 w-40" />
    </div>
  )
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!contact) return null

  const fullName = `${contact.first_name} ${contact.last_name}`

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={fullName}
        breadcrumb={{ label: 'Contacts', to: '/contacts' }}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => confirm.confirm('Delete this contact? This cannot be undone.')}>Delete</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <DetailCard title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <FieldRow label="Email" value={<a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">{contact.email}</a>} />
              <FieldRow label="Phone" value={contact.phone ? <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">{contact.phone}</a> : '—'} />
              <FieldRow label="Account" value={contact.account_id ? <Link to={`/accounts/${contact.account_id}`} className="text-indigo-600 hover:underline">{contact.account_id}</Link> : '—'} />
            </div>
          </DetailCard>

          <DetailCard title="Activity History">
            <div className="space-y-3">
              {activities.data?.items.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <Badge variant="activity" value={a.type} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{a.subject}</p>
                    {a.notes && <p className="text-xs text-slate-500">{a.notes}</p>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {a.activity_date ? formatDate(a.activity_date) : '—'}
                  </span>
                </div>
              ))}
              {!activities.isLoading && activities.data?.items.length === 0 && (
                <p className="text-sm text-slate-400">No activity history yet.</p>
              )}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title="Emails">
            <div className="space-y-2">
              {emails.data?.items.map((em) => (
                <Link key={em.id} to={`/admin/mock-email/${em.id}`} className="block py-2 border-b border-slate-100 last:border-0 hover:text-indigo-600 transition-colors">
                  <p className="text-sm font-medium text-slate-900">{em.subject}</p>
                  <p className="text-xs text-slate-400">{formatRelativeDate(em.sent_at)}</p>
                </Link>
              ))}
              {!emails.isLoading && emails.data?.items.length === 0 && (
                <p className="text-sm text-slate-400">No emails found.</p>
              )}
            </div>
          </DetailCard>
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
