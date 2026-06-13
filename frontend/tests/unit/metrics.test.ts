import { describe, it, expect } from 'vitest'
import {
  computeWeightedPipeline,
  computeOpenPipeline,
  computeWinRate,
  computeActiveLeadCount,
} from '@/utils/metrics'
import type { Opportunity, Lead } from '@/types/api'

function makeOpp(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: '1',
    title: 'Test',
    account_id: 'a1',
    contact_id: null,
    stage: 'prospecting',
    value: null,
    probability: null,
    expected_close_date: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: '1',
    first_name: 'Test',
    last_name: 'Lead',
    email: 'test@example.com',
    company: null,
    source: null,
    status: 'new',
    notes: null,
    converted_opportunity_id: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('computeWeightedPipeline', () => {
  it('sums value * probability for open stages', () => {
    const opps = [
      makeOpp({ stage: 'proposal', value: 10000, probability: 50 }),
      makeOpp({ stage: 'negotiation', value: 20000, probability: 75 }),
    ]
    expect(computeWeightedPipeline(opps)).toBe(5000 + 15000)
  })

  it('excludes closed-won and closed-lost', () => {
    const opps = [
      makeOpp({ stage: 'closed-won', value: 50000, probability: 100 }),
      makeOpp({ stage: 'closed-lost', value: 30000, probability: 0 }),
    ]
    expect(computeWeightedPipeline(opps)).toBe(0)
  })

  it('handles null values gracefully', () => {
    const opps = [makeOpp({ stage: 'prospecting', value: null, probability: null })]
    expect(computeWeightedPipeline(opps)).toBe(0)
  })
})

describe('computeOpenPipeline', () => {
  it('sums value for non-closed stages', () => {
    const opps = [
      makeOpp({ stage: 'proposal', value: 10000 }),
      makeOpp({ stage: 'closed-won', value: 5000 }),
    ]
    expect(computeOpenPipeline(opps)).toBe(10000)
  })
})

describe('computeWinRate', () => {
  it('returns null when no closed deals', () => {
    const opps = [makeOpp({ stage: 'proposal' })]
    expect(computeWinRate(opps)).toBeNull()
  })

  it('calculates win rate correctly', () => {
    const opps = [
      makeOpp({ stage: 'closed-won' }),
      makeOpp({ stage: 'closed-won' }),
      makeOpp({ stage: 'closed-lost' }),
    ]
    expect(computeWinRate(opps)).toBe(67)
  })
})

describe('computeActiveLeadCount', () => {
  it('counts new, contacted, qualified leads', () => {
    const leads = [
      makeLead({ status: 'new' }),
      makeLead({ status: 'contacted' }),
      makeLead({ status: 'qualified' }),
      makeLead({ status: 'lost' }),
    ]
    expect(computeActiveLeadCount(leads)).toBe(3)
  })
})
