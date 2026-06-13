import { useState, useCallback } from 'react'

export function useConfirmDialog() {
  const [resolver, setResolver] = useState<((confirmed: boolean) => void) | null>(null)
  const [message, setMessage] = useState('')
  const isOpen = resolver !== null

  const confirm = useCallback(
    (msg: string): Promise<boolean> =>
      new Promise((resolve) => {
        setMessage(msg)
        setResolver(() => resolve)
      }),
    []
  )

  const handleConfirm = useCallback(() => {
    resolver?.(true)
    setResolver(null)
  }, [resolver])

  const handleCancel = useCallback(() => {
    resolver?.(false)
    setResolver(null)
  }, [resolver])

  return { confirm, isOpen, message, handleConfirm, handleCancel }
}
