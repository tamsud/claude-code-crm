# Sales CRM — Frontend

**Stack:** Node 22 · React 18 · TypeScript 5 · Vite 5 · Tailwind CSS · React Query · React Router v6 · Sonner · Lucide Icons

## Prerequisites

- Node.js 22.17.1+ (`node --version`)
- npm 10.9.2+ (`npm --version`)

## Local Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env.local
# VITE_API_BASE_URL defaults to http://localhost:8000

# 3. Start dev server
npm run dev
```

App: `http://localhost:5173`

Make sure the backend is running on `http://localhost:8000` before starting.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

## Authentication

- JWT token stored in **module-level memory** (never localStorage/sessionStorage)
- Unauthenticated users are redirected to `/login`
- Token automatically attached as `Authorization: Bearer` header via Axios interceptor
- 401 responses clear the token and redirect to `/login`

## Role-Based UI

| Path | Admin | Manager | Sales Rep |
|------|-------|---------|-----------|
| `/` dashboard | ✓ | ✓ | ✓ |
| `/accounts` | ✓ (CRUD) | ✓ (CRUD) | ✓ (read) |
| `/contacts` | ✓ (CRUD) | ✓ (CRUD) | ✓ (read) |
| `/leads` | ✓ (CRUD) | ✓ (CRUD) | ✓ (own) |
| `/opportunities` | ✓ (CRUD) | ✓ (CRUD) | ✓ (read) |
| `/activities` | ✓ (CRUD) | ✓ (CRUD) | ✓ (own) |
| `/admin/users` | ✓ | — | — |
| `/admin/seed` | ✓ | — | — |
| `/profile` | ✓ | ✓ | ✓ |

## Key Source Files

```
src/
├── api/
│   ├── client.ts          # Axios instance with auth interceptors
│   ├── tokenStore.ts      # Module singleton — JWT lives here
│   ├── auth.ts            # loginApi()
│   └── users.ts           # listUsers, createUser, updateUser, seedUsers
├── contexts/
│   └── AuthContext.tsx    # AuthProvider, useAuth() hook
├── router/
│   ├── index.tsx          # All routes (including /login, /profile, /admin/users)
│   └── ProtectedRoute.tsx # Redirects unauthenticated users + role guard
├── features/
│   ├── auth/LoginPage.tsx
│   ├── profile/ProfilePage.tsx
│   ├── admin/UserManagementPage.tsx
│   ├── accounts/
│   ├── contacts/
│   ├── leads/
│   ├── opportunities/
│   └── activities/
├── components/
│   ├── layout/NavSidebar.tsx   # Indigo sidebar with role badge + user card
│   └── ui/SortFilterBar.tsx    # Reusable search/sort/direction bar
└── hooks/
    └── useSortFilter.ts        # State management for sort/filter controls
```

## Build

```bash
npm run build       # Production build → dist/
npm run preview     # Preview production build
npm run type-check  # TypeScript check
npm run lint        # ESLint
```
