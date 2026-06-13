import client from '@/api/client'

export interface UserResponse {
  id: string
  email: string
  display_name: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  password: string
  role: 'admin' | 'manager' | 'sales_rep'
  display_name?: string
}

export interface UserUpdate {
  role?: 'admin' | 'manager' | 'sales_rep'
  is_active?: boolean
  display_name?: string
}

export interface PaginatedUsers {
  total: number
  page: number
  size: number
  items: UserResponse[]
}

export async function listUsers(page = 1, size = 20): Promise<PaginatedUsers> {
  const res = await client.get<PaginatedUsers>('/api/v1/users/', { params: { page, size } })
  return res.data
}

export async function createUser(data: UserCreate): Promise<UserResponse> {
  const res = await client.post<UserResponse>('/api/v1/users/', data)
  return res.data
}

export async function updateUser(id: string, data: UserUpdate): Promise<UserResponse> {
  const res = await client.patch<UserResponse>(`/api/v1/users/${id}`, data)
  return res.data
}

export async function seedUsers(): Promise<{ created: number; skipped: number }> {
  const res = await client.post<{ created: number; skipped: number }>('/api/v1/admin/seed-users')
  return res.data
}
