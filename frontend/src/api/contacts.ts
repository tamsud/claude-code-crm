import client from './client'
import type { Contact, ContactCreate, ContactUpdate, PaginatedResponse } from '@/types/api'
import type { ContactListParams } from '@/types/ui'

const BASE = '/api/v1/contacts'

export const contactsApi = {
  list: (p: ContactListParams = {}) =>
    client.get<PaginatedResponse<Contact>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<Contact>(`${BASE}/${id}`).then((r) => r.data),
  create: (body: ContactCreate) =>
    client.post<Contact>(BASE + '/', body).then((r) => r.data),
  update: (id: string, body: ContactUpdate) =>
    client.patch<Contact>(`${BASE}/${id}`, body).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),
}
