import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import client from '@/api/client'
import type { UserResponse } from '@/api/users'
import { usePageTitle } from '@/hooks/usePageTitle'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  sales_rep: 'Sales Representative',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  sales_rep: 'bg-green-100 text-green-800',
}

export default function ProfilePage() {
  usePageTitle('Profile')
  const { user, updateDisplayName } = useAuth()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')
  const [editing, setEditing] = useState(false)

  const { data: me } = useQuery<UserResponse>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await client.get<UserResponse>('/api/v1/users/me')
      return res.data
    },
  })

  useEffect(() => {
    if (me && !editing) setDisplayName(me.display_name ?? '')
  }, [me, editing])

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await client.patch<UserResponse>('/api/v1/users/me', { display_name: name })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', 'me'], data)
      updateDisplayName(data.display_name ?? '')
      setEditing(false)
      toast.success('Display name updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const roleKey = user?.role ?? 'sales_rep'

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 h-24" />
        <div className="px-6 pb-6 -mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 ring-4 ring-white text-indigo-700 font-bold text-xl">
            {(me?.display_name ?? me?.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-semibold text-slate-900">{me?.display_name ?? me?.email}</h2>
            <p className="text-slate-500 text-sm">{me?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
        <h3 className="font-semibold text-slate-900">Account Details</h3>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Role</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[roleKey]}`}>
              {ROLE_LABELS[roleKey]}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
            <p className="text-slate-900">{me?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Display Name</label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your display name"
                />
                <button
                  onClick={() => mutation.mutate(displayName)}
                  disabled={mutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setDisplayName(me?.display_name ?? '') }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-slate-900">{me?.display_name || <span className="text-slate-400 italic">Not set</span>}</p>
                <button
                  onClick={() => { setEditing(true); setDisplayName(me?.display_name ?? '') }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
            <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Active
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Member since</label>
            <p className="text-slate-900 text-sm">
              {me?.created_at ? new Date(me.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
