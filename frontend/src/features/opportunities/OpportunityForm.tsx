import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import type { OpportunityCreate, OpportunityStage } from '@/types/api'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { contactsApi } from '@/api/contacts'
import { Button } from '@/components/ui/Button'

const STAGES: OpportunityStage[] = [
  'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
]

interface OpportunityFormProps {
  defaultValues?: Partial<OpportunityCreate>
  onSubmit: (data: OpportunityCreate) => void
  onCancel: () => void
  loading?: boolean
}

export function OpportunityForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: OpportunityFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<OpportunityCreate>({
    defaultValues: { stage: 'prospecting', probability: 0, ...defaultValues },
  })

  const accounts = useQuery({
    queryKey: queryKeys.accounts.list({}),
    queryFn: () => accountsApi.list({ size: 200 }),
  })

  const contacts = useQuery({
    queryKey: queryKeys.contacts.list({}),
    queryFn: () => contactsApi.list({ size: 200 }),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title', { required: 'Required' })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Value (USD)</label>
          <input
            {...register('value', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Probability (0–100)
          </label>
          <input
            {...register('probability', {
              valueAsNumber: true,
              min: { value: 0, message: 'Min 0' },
              max: { value: 100, message: 'Max 100' },
            })}
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
        <select
          {...register('stage')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Account <span className="text-red-500">*</span>
        </label>
        <select
          {...register('account_id', { required: 'Required' })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Select account —</option>
          {accounts.data?.items.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {errors.account_id && (
          <p className="mt-1 text-xs text-red-600">{errors.account_id.message}</p>
        )}
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
          Expected Close Date
        </label>
        <input
          {...register('expected_close_date')}
          type="date"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save
        </Button>
      </div>
    </form>
  )
}
