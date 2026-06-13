import { describe, it, expect } from 'vitest'
import { getNextStates, canConvert, hasTransitions, VALID_TRANSITIONS } from '@/utils/leadStateMachine'
import type { Lead } from '@/types/api'

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

describe('VALID_TRANSITIONS', () => {
  it('allows new → contacted and new → lost', () => {
    expect(VALID_TRANSITIONS.new).toContain('contacted')
    expect(VALID_TRANSITIONS.new).toContain('lost')
  })

  it('allows contacted → qualified and contacted → lost', () => {
    expect(VALID_TRANSITIONS.contacted).toContain('qualified')
    expect(VALID_TRANSITIONS.contacted).toContain('lost')
  })

  it('allows qualified → lost only', () => {
    expect(VALID_TRANSITIONS.qualified).toEqual(['lost'])
  })

  it('allows no transitions from lost', () => {
    expect(VALID_TRANSITIONS.lost).toHaveLength(0)
  })
})

describe('getNextStates', () => {
  it('returns valid next states for new', () => {
    expect(getNextStates('new')).toEqual(['contacted', 'lost'])
  })

  it('returns empty array for lost', () => {
    expect(getNextStates('lost')).toEqual([])
  })
})

describe('canConvert', () => {
  it('returns true for qualified lead not yet converted', () => {
    const lead = makeLead({ status: 'qualified', converted_opportunity_id: null })
    expect(canConvert(lead)).toBe(true)
  })

  it('returns false for non-qualified lead', () => {
    expect(canConvert(makeLead({ status: 'new' }))).toBe(false)
    expect(canConvert(makeLead({ status: 'contacted' }))).toBe(false)
    expect(canConvert(makeLead({ status: 'lost' }))).toBe(false)
  })

  it('returns false for already converted lead', () => {
    const lead = makeLead({ status: 'qualified', converted_opportunity_id: 'opp-123' })
    expect(canConvert(lead)).toBe(false)
  })
})

describe('hasTransitions', () => {
  it('returns true for new', () => {
    expect(hasTransitions('new')).toBe(true)
  })

  it('returns false for lost', () => {
    expect(hasTransitions('lost')).toBe(false)
  })
})
