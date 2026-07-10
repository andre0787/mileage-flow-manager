import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Online status', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('navigator.onLine returns true when online', () => {
    expect(navigator.onLine).toBe(true)
  })

  it('navigator.onLine returns false when offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    expect(navigator.onLine).toBe(false)
  })
})
