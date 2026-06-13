import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DollarSign, Percent, Calendar } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { opportunitiesApi } from '@/api/opportunities'
import { activitiesApi } from '@/api/activities'
import type { OpportunityCreate, OpportunityStage, ActivityCreate } from '@/types/api'
import { DetailHeader } from '@/components/layout/DetailHeader'
import { ProfileSidebar } from '@/components/layout/ProfileSidebar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { OpportunityForm } from './OpportunityForm'
import { ActivityLogForm } from '@/features/activities/ActivityLogForm'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate, formatRelativeDate } from '@/utils/formatters'

const STAGES: OpportunityStage[] = [
  'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
]

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [showLogActivity, setShowLogActivity] = useState(false)
  const confirm = useConfirmDialog()

  const { data: opp, isLoading, error } = useQuery({
    queryKey: queryKeys.opportunities.detail(id!),
    queryFn: () => opportunitiesApi.get(id!),
    enabled: !!id,
  })

  const activities = useQuery({
    queryKey: queryKeys.activities.list({ opportunity_id: id }),
    queryFn: () => activitiesApi.list({ opportunity_id: id, size: 50 }),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: OpportunityCreate) => opportunitiesApi.update(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.detail(id!) })
      toast.success('Opportunity updated')
      setShowEdit(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const stageMutation = useMutation({
    mutationFn: (stage: OpportunityStage) =>
      opportunitiesApi.update(id!, { ...opp!, stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.detail(id!) })
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.lists() })
      toast.success('Stage updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const logActivityMutation = useMutation({
    mutationFn: (body: ActivityCreate) => activitiesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activities.list({ opportunity_id: id }) })
      toast.success('Activity logged')
      setShowLogActivity(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => opportunitiesApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.lists() })
      toast.success('Opportunity deleted')
      navigate('/opportunities')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <LoadingSpinner className="m-8" />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!opp) return null

  const sidebarFields = [
    { icon: DollarSign, label: 'Value', value: formatCurrency(opp.value ?? 0) },
    { icon: Percent, label: 'Probability', value: `${opp.probability ?? 0}%` },
    ...(opp.expected_close_date
      ? [{ icon: Calendar, label: 'Close Date', value: formatDate(opp.expected_close_date) }]
      : []),
  ]

  return (
    <div>
      <DetailHeader
        backTo="/opportunities"
        backLabel="Pipeline"
        title={opp.title}
        subtitle={<Badge variant="stage" value={opp.stage} />}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirm.confirm('Delete this opportunity? This cannot be undone.')}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 p-6">
        <ProfileSidebar
          name={opp.title}
          avatarColor="bg-violet-600"
          fields={sidebarFields}
        />

        <div className="flex-1 min-w-0 space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Stage</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => stageMutation.mutate(s)}
                  disabled={s === opp.stage || stageMutation.isPending}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    s === opp.stage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Activities</h3>
              <Button size="sm" variant="secondary" onClick={() => setShowLogActivity(true)}>
                Log Activity
              </Button>
            </div>
            {activities.isLoading && <LoadingSpinner />}
            {activities.data?.items.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <Badge variant="activity" value={a.type} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                  {a.notes && <p className="text-xs text-gray-500">{a.notes}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {a.activity_date ? formatRelativeDate(a.activity_date) : '—'}
                </span>
              </div>
            ))}
            {activities.data?.items.length === 0 && (
              <p className="text-sm text-gray-400">No activities logged yet.</p>
            )}
          </Card>
        </div>
      </div>

      <Modal open={showEdit} onOpenChange={setShowEdit} title="Edit Opportunity" size="lg">
        <OpportunityForm
          defaultValues={{
            title: opp.title,
            stage: opp.stage,
            value: opp.value ?? undefined,
            probability: opp.probability ?? undefined,
            account_id: opp.account_id,
            contact_id: opp.contact_id ?? undefined,
            expected_close_date: opp.expected_close_date ?? undefined,
          }}
          onSubmit={(body) => updateMutation.mutate(body)}
          onCancel={() => setShowEdit(false)}
          loading={updateMutation.isPending}
        />
      </Modal>

      <Modal
        open={showLogActivity}
        onOpenChange={setShowLogActivity}
        title="Log Activity"
      >
        <ActivityLogForm
          defaultValues={{ opportunity_id: id }}
          onSubmit={(body) => logActivityMutation.mutate(body)}
          onCancel={() => setShowLogActivity(false)}
          loading={logActivityMutation.isPending}
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
