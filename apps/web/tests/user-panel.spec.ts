import { describe, expect, it } from 'vitest'

import {
  formatUserPanelUpdatedAt,
  isUnauthorizedUserPanelError
} from '../src/features/user-panel/user-panel'

describe('user panel helpers', () => {
  it('includes the year when formatting created-note timestamps', () => {
    expect(formatUserPanelUpdatedAt('2025-12-31T23:45:00.000Z')).toMatch(/^\d{4}/u)
  })

  it('recognizes unauthorized my-notes failures', () => {
    expect(isUnauthorizedUserPanelError({
      response: {
        status: 401
      }
    })).toBe(true)
    expect(isUnauthorizedUserPanelError({
      response: {
        status: 500
      }
    })).toBe(false)
  })
})
