import { Outlet } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'

export function AppShell() {
  return (
    <div className="flex h-screen bg-gray-50">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
