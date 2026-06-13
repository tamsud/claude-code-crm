import type { LeadStatus, Lead } from '../types/api'

export const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new:       ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['lost'],
  lost:      [],
}

export function getNextStates(current: LeadStatus): LeadStatus[] {
  return VALID_TRANSITIONS[current]
}

export function canConvert(lead: Pick<Lead, 'status' | 'converted_opportunity_id'>): boolean {
  return lead.status === 'qualified' && lead.converted_opportunity_id === null
}

export function hasTransitions(current: LeadStatus): boolean {
  return VALID_TRANSITIONS[current].length > 0
}
