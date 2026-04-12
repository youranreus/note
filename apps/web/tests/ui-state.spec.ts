import { describe, expect, it } from 'vitest'

import { foundationStateRegistry } from '../src/components/ui/state-presets'

describe('foundation state registry', () => {
  it('defines the four required interaction states for every shell component', () => {
    for (const states of Object.values(foundationStateRegistry)) {
      expect(states).toEqual(['default', 'focus', 'error', 'disabled'])
    }
  })
})
