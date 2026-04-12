import { describe, expect, it } from 'vitest'

import { createAppRouter } from '../src/router'

describe('app router shell', () => {
  it('registers the four story shell routes', () => {
    const router = createAppRouter()
    const routePaths = router.getRoutes().map((route) => route.path)

    expect(routePaths).toEqual(
      expect.arrayContaining([
        '/',
        '/auth/callback',
        '/o',
        '/o/:sid',
        '/l',
        '/l/:sid'
      ])
    )
  })
})
