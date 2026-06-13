import client from './client'
import type { Account, AccountCreate, AccountUpdate, PaginatedResponse } from '@/types/api'
import type { AccountListParams } from '@/types/ui'

const BASE = '/api/v1/accounts'

export const accountsApi = {
  list: (p: AccountListParams = {}) =>
    client.get<PaginatedResponse<Account>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<Account>(`${BASE}/${id}`).then((r) => r.data),
  create: (body: AccountCreate) =>
    client.post<Account>(BASE + '/', body).then((r) => r.data),
  update: (id: string, body: AccountUpdate) =>
    client.patch<Account>(`${BASE}/${id}`, body).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),
}
