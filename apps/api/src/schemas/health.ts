export const healthResponseSchema = {
  type: 'object',
  required: ['ok', 'service', 'timestamp'],
  properties: {
    ok: { type: 'boolean' },
    service: { type: 'string' },
    timestamp: { type: 'string' }
  }
} as const
