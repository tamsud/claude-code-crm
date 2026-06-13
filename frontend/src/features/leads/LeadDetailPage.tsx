import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Building2 } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { leadsApi } from '@/api/leads'
import type { LeadCreate, LeadStatus } from '@/types/api'
import { getNextStates, canConvert } from '@/utils/leadStateMachine'
import { DetailHeader } from '@/components/layout/DetailHeader'
import { ProfileSidebar } from '@/components/layout/ProfileSidebar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LeadForm } from './LeadForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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

  if (isLoading) return <LoadingSpinner className="m-8" />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!lead) return null

  const nextStates = getNextStates(lead.status)
  const convertible = canConvert(lead)
  const fullName = `${lead.first_name} ${lead.last_name}`

  const sidebarFields = [
    { icon: Mail, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
    ...(lead.company ? [{ icon: Building2, label: 'Company', value: lead.company }] : []),
  ]

  return (
    <div>
      <DetailHeader
        backTo="/leads"
        backLabel="Leads"
        title={fullName}
        subtitle={<Badge variant="status" value={lead.status} />}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirm.confirm('Delete this lead? This cannot be undone.')}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 p-6">
        <ProfileSidebar
          name={fullName}
          avatarColor="bg-amber-600"
          fields={sidebarFields}
        />

        <div className="flex-1 min-w-0 space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Status Transition
            </h3>
            {nextStates.length === 0 ? (
              <p className="text-sm text-gray-400">No further transitions available.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {nextStates.map((s) => (
                  <Button
                    key={s}
                    variant="secondary"
                    size="sm"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate(s)}
                  >
                    → {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          {convertible && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Convert to Opportunity
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                This lead is qualified and ready to be converted to an opportunity.
              </p>
              <Button
                loading={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
              >
                Convert to Opportunity
              </Button>
            </Card>
          )}

          {lead.converted_opportunity_id && (
            <Card>
              <p className="text-sm text-gray-500">
                Converted to{' '}
                <a
                  href={`/opportunities/${lead.converted_opportunity_id}`}
                  className="text-blue-600 hover:underline"
                >
                  opportunity
                </a>
                .
              </p>
            </Card>
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
