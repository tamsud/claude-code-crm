import { describe, it, expect } from 'vitest'
import { formatCurrency, formatRelativeDate, formatDate, formatProbability } from '@/utils/formatters'

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('formats thousands with commas', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
  })

  it('formats large values', () => {
    const result = formatCurrency(250000)
    expect(result).toContain('250,000')
  })
})

describe('formatRelativeDate', () => {
  it('returns relative label for recent dates', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
    const result = formatRelativeDate(twoDaysAgo)
    expect(result).toMatch(/\d+ days ago/)
  })

  it('returns formatted date for old dates', () => {
    const old = '2020-01-15T12:00:00Z'
    const result = formatRelativeDate(old)
    expect(result).toContain('2020')
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-06-13T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatProbability', () => {
  it('formats null as em dash', () => {
    expect(formatProbability(null)).toBe('—')
  })

  it('formats number with percent sign', () => {
    expect(formatProbability(75)).toBe('75%')
  })
})
