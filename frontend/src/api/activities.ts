import client from './client'
import type { Activity, ActivityCreate, ActivityUpdate, PaginatedResponse } from '@/types/api'
import type { ActivityListParams } from '@/types/ui'

const BASE = '/api/v1/activities'

export const activitiesApi = {
  list: (p: ActivityListParams = {}) =>
    client.get<PaginatedResponse<Activity>>(BASE + '/', { params: p }).then((r) => r.data),
  get: (id: string) =>
    client.get<Activity>(`${BASE}/${id}`).then((r) => r.data),
  create: (body: ActivityCreate) =>
    client.post<Activity>(BASE + '/', body).then((r) => r.data),
  update: (id: string, body: ActivityUpdate) =>
    client.patch<Activity>(`${BASE}/${id}`, body).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),
}
