const meErrorCodes = ['ME_AUTH_REQUIRED'] as const
const meErrorStatuses = ['unauthorized'] as const

export const myNotesQuerySchema = {
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      maximum: 10000,
      default: 1
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20
    }
  }
} as const

export const myNotesResponseSchema = {
  type: 'object',
  required: ['items', 'page', 'limit', 'total', 'hasMore'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sid', 'preview', 'updatedAt'],
        properties: {
          sid: { type: 'string' },
          preview: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      }
    },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    total: { type: 'integer' },
    hasMore: { type: 'boolean' }
  }
} as const

export const meErrorSchema = {
  type: 'object',
  required: ['code', 'status', 'message'],
  properties: {
    code: {
      type: 'string',
      enum: meErrorCodes
    },
    status: {
      type: 'string',
      enum: meErrorStatuses
    },
    message: { type: 'string' }
  }
} as const
