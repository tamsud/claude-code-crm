import type { Lead, Opportunity, Activity } from '../types/api'

export function computeWeightedPipeline(opps: Opportunity[]): number {
  return opps
    .filter((o) => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
    .reduce((sum, o) => {
      if (o.value == null || o.probability == null) return sum
      return sum + (o.value * o.probability) / 100
    }, 0)
}

export function computeOpenPipeline(opps: Opportunity[]): number {
  return opps
    .filter((o) => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
    .reduce((sum, o) => sum + (o.value ?? 0), 0)
}

export function computeWinRate(opps: Opportunity[]): number | null {
  const won = opps.filter((o) => o.stage === 'closed-won').length
  const lost = opps.filter((o) => o.stage === 'closed-lost').length
  if (won + lost === 0) return null
  return Math.round((won / (won + lost)) * 100)
}

export function computeActiveLeadCount(leads: Lead[]): number {
  return leads.filter(
    (l) => l.status === 'new' || l.status === 'contacted' || l.status === 'qualified'
  ).length
}

export function computeDaysSinceLastContact(activities: Activity[]): number | null {
  const sorted = activities
    .filter((a) => a.activity_date != null)
    .sort(
      (a, b) =>
        new Date(b.activity_date!).getTime() - new Date(a.activity_date!).getTime()
    )
  if (sorted.length === 0) return null
  const ms = Date.now() - new Date(sorted[0].activity_date!).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function validateActivityLinks(
  contactId: string | null | undefined,
  opportunityId: string | null | undefined
): string | null {
  if (!contactId && !opportunityId) {
    return 'Activity must be linked to a contact or opportunity'
  }
  return null
}

export function validateOpportunityValue(value: number | null | undefined): string | null {
  if (value != null && value <= 0) return 'Value must be greater than zero'
  return null
}

export function validateProbability(value: number | null | undefined): string | null {
  if (value != null && (value < 0 || value > 100)) {
    return 'Probability must be between 0 and 100'
  }
  return null
}
