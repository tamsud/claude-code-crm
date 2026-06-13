import client from './client'
import type { SeedResult } from '@/types/api'

export const seedApi = {
  seedDemo: () =>
    client.post<SeedResult>('/api/v1/seed/').then((r) => r.data),
  clearAll: () =>
    client.delete('/api/v1/seed/').then((r) => r.data),
}
