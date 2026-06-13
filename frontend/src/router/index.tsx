import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AccountsListPage } from '@/features/accounts/AccountsListPage'
import { AccountDetailPage } from '@/features/accounts/AccountDetailPage'
import { ContactsListPage } from '@/features/contacts/ContactsListPage'
import { ContactDetailPage } from '@/features/contacts/ContactDetailPage'
import { LeadsListPage } from '@/features/leads/LeadsListPage'
import { LeadDetailPage } from '@/features/leads/LeadDetailPage'
import { OpportunitiesListPage } from '@/features/opportunities/OpportunitiesListPage'
import { OpportunityDetailPage } from '@/features/opportunities/OpportunityDetailPage'
import { ActivitiesLogPage } from '@/features/activities/ActivitiesLogPage'
import { MockEmailPage } from '@/features/email/MockEmailPage'
import { EmailDetailPage } from '@/features/email/EmailDetailPage'
import { SeedManagerPage } from '@/features/admin/SeedManagerPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import LoginPage from '@/features/auth/LoginPage'
import ProtectedRoute from '@/router/ProtectedRoute'
import ProfilePage from '@/features/profile/ProfilePage'
import UserManagementPage from '@/features/admin/UserManagementPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'accounts', element: <AccountsListPage /> },
      { path: 'accounts/:id', element: <AccountDetailPage /> },
      { path: 'contacts', element: <ContactsListPage /> },
      { path: 'contacts/:id', element: <ContactDetailPage /> },
      { path: 'leads', element: <LeadsListPage /> },
      { path: 'leads/:id', element: <LeadDetailPage /> },
      { path: 'opportunities', element: <OpportunitiesListPage /> },
      { path: 'opportunities/:id', element: <OpportunityDetailPage /> },
      { path: 'activities', element: <ActivitiesLogPage /> },
      { path: 'admin/mock-email', element: <MockEmailPage /> },
      { path: 'admin/mock-email/:id', element: <EmailDetailPage /> },
      { path: 'admin/seed', element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SeedManagerPage />
          </ProtectedRoute>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <Navigate to="/profile" replace /> },
      { path: 'admin/users', element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
