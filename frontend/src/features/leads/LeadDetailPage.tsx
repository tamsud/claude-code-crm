import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { leadsApi } from '@/api/leads'
import type { LeadCreate, LeadStatus } from '@/types/api'
import { getNextStates, canConvert } from '@/utils/leadStateMachine'
import { PageHeader } from '@/components/layout/PageHeader'
import { DetailCard, FieldRow } from '@/components/ui/DetailCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonText } from '@/components/ui/Skeleton'
import { LeadForm } from './LeadForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate } from '@/utils/formatters'

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const confirm = useConfirmDialog()

  const { data: lead, isLoading, error } = useQuery({
    queryKey: queryKeys.leads.detail(id!),
    queryFn: () => leadsApi.get(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: LeadCreate) => leadsApi.update(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(id!) })
      toast.success('Lead updated')
      setShowEdit(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) => leadsApi.patchStatus(id!, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(id!) })
      qc.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      toast.success('Status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const convertMutation = useMutation({
    mutationFn: () => leadsApi.convert(id!),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(id!) })
      toast.success('Lead converted to opportunity')
      navigate(`/opportunities/${result.opportunity.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      toast.success('Lead deleted')
      navigate('/leads')
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
  if (!lead) return null

  const nextStates = getNextStates(lead.status)
  const convertible = canConvert(lead)
  const fullName = `${lead.first_name} ${lead.last_name}`

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={fullName}
        breadcrumb={{ label: 'Leads', to: '/leads' }}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => confirm.confirm('Delete this lead? This cannot be undone.')}>Delete</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <DetailCard title="Lead Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <FieldRow label="Status" value={<Badge variant="status" value={lead.status} />} />
              <FieldRow label="Company" value={lead.company ?? '—'} />
              <FieldRow label="Email" value={<a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">{lead.email}</a>} />
              <FieldRow label="Source" value={lead.source ?? '—'} />
              <FieldRow label="Created" value={formatRelativeDate(lead.created_at)} />
            </div>
          </DetailCard>

          {(nextStates.length > 0 || convertible || lead.converted_opportunity_id) && (
            <DetailCard title="Actions">
              <div className="space-y-4">
                {nextStates.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Move to next stage:</p>
                    <div className="flex gap-2 flex-wrap">
                      {nextStates.map((s) => (
                        <Button key={s} variant="secondary" size="sm" loading={statusMutation.isPending} onClick={() => statusMutation.mutate(s)}>
                          → {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {convertible && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">This lead is qualified and ready to convert:</p>
                    <Button loading={convertMutation.isPending} onClick={() => convertMutation.mutate()}>
                      Convert to Opportunity
                    </Button>
                  </div>
                )}
                {lead.converted_opportunity_id && (
                  <p className="text-sm text-slate-500">
                    Converted to{' '}
                    <a href={`/opportunities/${lead.converted_opportunity_id}`} className="text-indigo-600 hover:underline">opportunity</a>.
                  </p>
                )}
              </div>
            </DetailCard>
          )}
        </div>
      </div>

      <Modal open={showEdit} onOpenChange={setShowEdit} title="Edit Lead">
        <LeadForm
          defaultValues={{
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            company: lead.company ?? undefined,
            source: lead.source ?? undefined,
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
