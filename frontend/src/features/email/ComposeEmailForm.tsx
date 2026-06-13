import { useForm } from 'react-hook-form'
import type { EmailSend } from '@/types/api'
import { Button } from '@/components/ui/Button'

interface ComposeEmailFormProps {
  defaultValues?: Partial<EmailSend>
  onSubmit: (data: EmailSend) => void
  onCancel: () => void
  loading?: boolean
}

export function ComposeEmailForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: ComposeEmailFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EmailSend>({
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          From <span className="text-red-500">*</span>
        </label>
        <input
          {...register('from_email', {
            required: 'Required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
          })}
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.from_email && (
          <p className="mt-1 text-xs text-red-600">{errors.from_email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          To <span className="text-red-500">*</span>
        </label>
        <input
          {...register('to_email', {
            required: 'Required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
          })}
          type="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.to_email && (
          <p className="mt-1 text-xs text-red-600">{errors.to_email.message}</p>
        )}
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Body <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('body', { required: 'Required' })}
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.body && (
          <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Send
        </Button>
      </div>
    </form>
  )
}
