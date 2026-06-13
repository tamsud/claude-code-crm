import client from '@/api/client'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/api/v1/auth/login', { email, password })
  return res.data
}
