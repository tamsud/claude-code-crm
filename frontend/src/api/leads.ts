import client from './client'
import type {
  Lead, LeadCreate, LeadUpdate, LeadStatusUpdate,
  ConvertLeadResponse, PaginatedResponse,
} from '@/types/api'
import type { LeadListParams } from '@/types/ui'

const BASE = '/api/v1/leads'

export const leadsApi = {
  list: (p: LeadListParams = {}) =>
    client.get<PaginatedResponse<Lead>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<Lead>(`${BASE}/${id}`).then((r) => r.data),
  create: (body: LeadCreate) =>
    client.post<Lead>(BASE + '/', body).then((r) => r.data),
  update: (id: string, body: LeadUpdate) =>
    client.patch<Lead>(`${BASE}/${id}`, body).then((r) => r.data),
  patchStatus: (id: string, body: LeadStatusUpdate) =>
    client.patch<Lead>(`${BASE}/${id}`, body).then((r) => r.data),
  convert: (id: string) =>
    client.post<ConvertLeadResponse>(`${BASE}/${id}/convert`).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),
}
