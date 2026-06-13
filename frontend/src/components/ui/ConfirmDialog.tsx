import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  title?: string
}

export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={(o) => !o && onCancel()} title={title} size="sm">
      <p className="mb-6 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  )
}
