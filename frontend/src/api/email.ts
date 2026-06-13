import client from './client'
import type { EmailMessage, EmailSend, PaginatedResponse } from '@/types/api'
import type { EmailListParams } from '@/types/ui'

const BASE = '/api/v1/mock-email'

export const emailApi = {
  list: (p: EmailListParams = {}) =>
    client.get<PaginatedResponse<EmailMessage>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<EmailMessage>(`${BASE}/${id}`).then((r) => r.data),
  send: (body: EmailSend) =>
    client.post<EmailMessage>(BASE + '/', body).then((r) => r.data),
  clearAll: () =>
    client.delete(BASE + '/').then((r) => r.data),
}
