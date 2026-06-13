import type {
  AccountListParams,
  ContactListParams,
  LeadListParams,
  OpportunityListParams,
  ActivityListParams,
  EmailListParams,
} from './types/ui'

export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    lists: () => ['accounts', 'list'] as const,
    list: (params: AccountListParams) => ['accounts', 'list', params] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    lists: () => ['contacts', 'list'] as const,
    list: (params: ContactListParams) => ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  leads: {
    all: ['leads'] as const,
    lists: () => ['leads', 'list'] as const,
    list: (params: LeadListParams) => ['leads', 'list', params] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    lists: () => ['opportunities', 'list'] as const,
    list: (params: OpportunityListParams) => ['opportunities', 'list', params] as const,
    detail: (id: string) => ['opportunities', 'detail', id] as const,
  },
  activities: {
    all: ['activities'] as const,
    lists: () => ['activities', 'list'] as const,
    list: (params: ActivityListParams) => ['activities', 'list', params] as const,
    detail: (id: string) => ['activities', 'detail', id] as const,
  },
  emails: {
    all: ['emails'] as const,
    lists: () => ['emails', 'list'] as const,
    list: (params: EmailListParams) => ['emails', 'list', params] as const,
    detail: (id: string) => ['emails', 'detail', id] as const,
  },
}
