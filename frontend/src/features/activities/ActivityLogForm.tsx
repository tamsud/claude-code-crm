import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import type { ActivityCreate, ActivityType } from '@/types/api'
import { queryKeys } from '@/queryKeys'
import { contactsApi } from '@/api/contacts'
import { opportunitiesApi } from '@/api/opportunities'
import { Button } from '@/components/ui/Button'

const TYPES: { value: ActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
]

interface ActivityLogFormProps {
  defaultValues?: Partial<ActivityCreate>
  onSubmit: (data: ActivityCreate) => void
  onCancel: () => void
  loading?: boolean
}

export function ActivityLogForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: ActivityLogFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const { register, handleSubmit, formState: { errors } } = useForm<ActivityCreate>({
    defaultValues: { type: 'call', activity_date: today, ...defaultValues },
  })

  const contacts = useQuery({
    queryKey: queryKeys.contacts.list({}),
    queryFn: () => contactsApi.list({ size: 200 }),
  })

  const opportunities = useQuery({
    queryKey: queryKeys.opportunities.list({}),
    queryFn: () => opportunitiesApi.list({ size: 200 }),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select
          {...register('type')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          {...register('subject', { required: 'Required' })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          {...register('activity_date', { required: 'Required' })}
          type="date"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
        <select
          {...register('contact_id')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— None —</option>
          {contacts.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Opportunity
        </label>
        <select
          {...register('opportunity_id')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— None —</option>
          {opportunities.data?.items.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Log Activity
        </Button>
      </div>
    </form>
  )
}
