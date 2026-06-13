import { useForm } from 'react-hook-form'
import type { AccountCreate } from '@/types/api'
import { Button } from '@/components/ui/Button'

interface AccountFormProps {
  defaultValues?: Partial<AccountCreate>
  onSubmit: (data: AccountCreate) => void
  onCancel: () => void
  loading?: boolean
}

export function AccountForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: AccountFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AccountCreate>({
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Industry
        </label>
        <input
          {...register('industry')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Website
        </label>
        <input
          {...register('website')}
          type="url"
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
