import client from './client'
import type { Opportunity, OpportunityCreate, OpportunityUpdate, PaginatedResponse } from '@/types/api'
import type { OpportunityListParams } from '@/types/ui'

const BASE = '/api/v1/opportunities'

export const opportunitiesApi = {
  list: (p: OpportunityListParams = {}) =>
    client.get<PaginatedResponse<Opportunity>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<Opportunity>(`${BASE}/${id}`).then((r) => r.data),
  create: (body: OpportunityCreate) =>
    client.post<Opportunity>(BASE + '/', body).then((r) => r.data),
  update: (id: string, body: OpportunityUpdate) =>
    client.patch<Opportunity>(`${BASE}/${id}`, body).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),
}
