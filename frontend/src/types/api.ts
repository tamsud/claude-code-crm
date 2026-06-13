export interface PaginatedResponse<T> {
  total: number
  page: number
  size: number
  items: T[]
}

export interface Account {
  id: string
  name: string
  industry: string | null
  website: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface AccountCreate {
  name: string
  industry?: string | null
  website?: string | null
  phone?: string | null
}

export type AccountUpdate = Partial<AccountCreate>

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string | null
  account_id: string | null
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  job_title?: string | null
  account_id?: string | null
}

export type ContactUpdate = Partial<ContactCreate>

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost'

export interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  converted_opportunity_id: string | null
  created_at: string
  updated_at: string
}

export interface LeadCreate {
  first_name: string
  last_name: string
  email: string
  company?: string | null
  source?: string | null
  status?: LeadStatus
  notes?: string | null
}

export type LeadUpdate = Partial<LeadCreate>

export interface LeadStatusUpdate {
  status: LeadStatus
}

export interface ConvertLeadResponse {
  lead: Lead
  opportunity: Opportunity
}

export type OpportunityStage =
  | 'prospecting'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost'

export interface Opportunity {
  id: string
  title: string
  account_id: string
  contact_id: string | null
  stage: OpportunityStage
  value: number | null
  probability: number | null
  expected_close_date: string | null
  created_at: string
  updated_at: string
}

export interface OpportunityCreate {
  title: string
  account_id: string
  contact_id?: string | null
  stage: OpportunityStage
  value?: number | null
  probability?: number | null
  expected_close_date?: string | null
}

export type OpportunityUpdate = Partial<OpportunityCreate>

export type ActivityType = 'call' | 'email' | 'meeting'

export interface Activity {
  id: string
  type: ActivityType
  subject: string
  notes: string | null
  activity_date: string | null
  contact_id: string | null
  opportunity_id: string | null
  created_at: string
  updated_at: string
}

export interface ActivityCreate {
  type: ActivityType
  subject: string
  notes?: string | null
  activity_date?: string | null
  contact_id?: string | null
  opportunity_id?: string | null
}

export type ActivityUpdate = Partial<ActivityCreate>

export interface EmailMessage {
  id: string
  from_email: string
  to_email: string
  subject: string
  body: string | null
  html_body: string | null
  sent_at: string
  created_at: string
}

export interface EmailSend {
  from_email: string
  to_email: string
  subject: string
  body?: string | null
  html_body?: string | null
}

export interface SeedResult {
  message: string
  seeded: {
    accounts: number
    contacts: number
    leads: number
    opportunities: number
    activities: number
    emails: number
  }
}
