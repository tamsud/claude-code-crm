import { useForm } from 'react-hook-form'
import type { LeadCreate } from '@/types/api'
import { Button } from '@/components/ui/Button'

interface LeadFormProps {
  defaultValues?: Partial<LeadCreate>
  onSubmit: (data: LeadCreate) => void
  onCancel: () => void
  loading?: boolean
}

export function LeadForm({ defaultValues, onSubmit, onCancel, loading }: LeadFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LeadCreate>({
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name', { required: 'Required' })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name', { required: 'Required' })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email', {
            required: 'Required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
          })}
          type="email"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input
          {...register('company')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
        <input
          {...register('source')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
