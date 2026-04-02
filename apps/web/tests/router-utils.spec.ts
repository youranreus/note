import { describe, expect, it } from 'vitest'

import { resolveSidParam } from '../src/router/sid'
import { moveTabSelection } from '../src/components/ui/segmented-tabs'

describe('route shell utilities', () => {
  it('accepts only single non-empty sid strings', () => {
    expect(resolveSidParam('note-123')).toBe('note-123')
    expect(resolveSidParam('   ')).toBeNull()
    expect(resolveSidParam(undefined)).toBeNull()
    expect(resolveSidParam(['a', 'b'])).toBeNull()
  })

  it('cycles segmented tab selection with arrow navigation', () => {
    expect(moveTabSelection(0, 2, 'next')).toBe(1)
    expect(moveTabSelection(1, 2, 'next')).toBe(0)
    expect(moveTabSelection(0, 2, 'prev')).toBe(1)
  })
})
