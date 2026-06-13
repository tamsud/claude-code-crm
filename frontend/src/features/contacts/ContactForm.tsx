import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import type { ContactCreate } from '@/types/api'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { Button } from '@/components/ui/Button'

interface ContactFormProps {
  defaultValues?: Partial<ContactCreate>
  onSubmit: (data: ContactCreate) => void
  onCancel: () => void
  loading?: boolean
}

export function ContactForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: ContactFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactCreate>({
    defaultValues,
  })

  const accounts = useQuery({
    queryKey: queryKeys.accounts.list({}),
    queryFn: () => accountsApi.list({ size: 200 }),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name', { required: 'Required' })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name', { required: 'Required' })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email', {
            required: 'Required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
          })}
          type="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
        <select
          {...register('account_id')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— None —</option>
          {accounts.data?.items.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
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
