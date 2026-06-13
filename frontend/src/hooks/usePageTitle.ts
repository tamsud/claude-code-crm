import { useEffect } from 'react'

const APP_NAME = 'CRM'

/**
 * Sets document.title to "{pageTitle} | CRM" on mount and restores on unmount.
 * Usage: usePageTitle('Leads')  →  tab shows "Leads | CRM"
 */
export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    const prev = document.title
    document.title = `${pageTitle} | ${APP_NAME}`
    return () => {
      document.title = prev
    }
  }, [pageTitle])
}
