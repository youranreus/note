import { afterAll, describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'

describe('api app shell', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  it('exposes a health endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      ok: true
    })
  })
})
