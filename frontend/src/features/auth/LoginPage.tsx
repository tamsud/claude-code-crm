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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Platform</h1>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {!needsSetup && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-600">Demo accounts:</p>
              <p>admin@crm.local · manager@crm.local · sales@crm.local</p>
              <p>Password: <span className="font-mono">password123</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
