import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import client from '@/api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupDone, setSetupDone] = useState(false)

  useEffect(() => {
    client.get('/api/v1/admin/bootstrap-status').then((res) => {
      setNeedsSetup(res.data.needs_setup === true)
    }).catch(() => {
      // ignore — bootstrap-status is best-effort
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetup() {
    setSetupLoading(true)
    try {
      await client.post('/api/v1/admin/seed-users')
      setSetupDone(true)
      setNeedsSetup(false)
      setEmail('admin@crm.local')
      setPassword('password123')
    } catch {
      setError('Setup failed. Please try again or contact your administrator.')
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel — visible on lg+ only */}
      <div className="hidden lg:flex lg:w-2/5 bg-brand flex-col justify-center p-12">
        <div className="inline-flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <rect x="2" y="14" width="5" height="7" rx="1" />
              <rect x="9.5" y="9" width="5" height="12" rx="1" />
              <rect x="17" y="4" width="5" height="17" rx="1" />
            </svg>
          </div>
          <span className="text-white text-lg font-bold">Sales CRM</span>
        </div>
        <h1 className="text-3xl font-semibold text-white leading-snug">
          Your CRM,<br />simplified.
        </h1>
        <p className="mt-4 text-white/70 text-base leading-relaxed">
          Manage leads, contacts, accounts, and opportunities — all in one place. Built for modern sales teams.
        </p>
        <ul className="mt-8 space-y-3 text-white/80 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
            Role-based access for your entire team
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
            Real-time pipeline and KPI dashboard
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
            Activity tracking and mock email notifications
          </li>
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-base">
        <div className="w-full max-w-sm">
          {/* Logo shown on mobile only */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                <rect x="2" y="14" width="5" height="7" rx="1" />
                <rect x="9.5" y="9" width="5" height="12" rx="1" />
                <rect x="17" y="4" width="5" height="17" rx="1" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-base">Sales CRM</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access your account.</p>

          {needsSetup && !setupDone && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">First-time setup required</p>
              <p className="text-xs text-amber-700 mb-3">
                No user accounts exist yet. Click below to create the demo accounts (admin, manager, sales rep).
              </p>
              <button
                onClick={handleSetup}
                disabled={setupLoading}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {setupLoading ? 'Creating demo users…' : 'Create demo accounts'}
              </button>
            </div>
          )}

          {setupDone && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Demo accounts created. Credentials pre-filled below — click Sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-accent hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {!needsSetup && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-600">Demo accounts:</p>
              <p>admin@crm.local · manager@crm.local · sales@crm.local</p>
              <p>Password: <span className="font-mono">password123</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
