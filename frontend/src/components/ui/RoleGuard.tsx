import { useAuth } from '@/contexts/AuthContext'
import type { AuthUser } from '@/contexts/AuthContext'

interface RoleGuardProps {
  allowedRoles: AuthUser['role'][]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user || !allowedRoles.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}
