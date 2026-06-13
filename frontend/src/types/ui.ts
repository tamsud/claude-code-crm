export type ContactTab = 'overview' | 'history' | 'emails'
export type AccountTab = 'contacts' | 'opportunities'
export type PipelineView = 'board' | 'table'
export type LeadStatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'lost'
export type ActivityTypeFilter = 'all' | 'call' | 'email' | 'meeting'

export interface SortFilterParams {
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface AccountListParams extends SortFilterParams {
  page?: number
  size?: number
}

export interface ContactListParams extends SortFilterParams {
  page?: number
  size?: number
  account_id?: string
}

export interface LeadListParams extends SortFilterParams {
  page?: number
  size?: number
  status?: string
}

export interface OpportunityListParams extends SortFilterParams {
  page?: number
  size?: number
  stage?: string
  account_id?: string
  contact_id?: string
}

export interface ActivityListParams extends SortFilterParams {
  page?: number
  size?: number
  type?: string
  contact_id?: string
  opportunity_id?: string
}

export interface EmailListParams {
  page?: number
  size?: number
  to?: string
}
