const favoriteErrorCodes = [
  'FAVORITE_AUTH_REQUIRED',
  'FAVORITE_NOTE_NOT_FOUND',
  'FAVORITE_NOTE_DELETED',
  'FAVORITE_SELF_OWNED_NOT_ALLOWED',
  'FAVORITE_NOTE_SID_CONFLICT'
] as const

const favoriteErrorStatuses = [
  'unauthorized',
  'not-found',
  'deleted',
  'forbidden',
  'error'
] as const

export const favoriteBodySchema = {
  type: 'object',
  required: ['sid'],
  properties: {
    sid: {
      type: 'string',
      minLength: 1
    }
  }
} as const

export const favoriteResponseSchema = {
  type: 'object',
  required: ['sid', 'favoriteState'],
  properties: {
    sid: { type: 'string' },
    favoriteState: {
      type: 'string',
      enum: ['favorited']
    }
  }
} as const

export const favoriteErrorSchema = {
  type: 'object',
  required: ['sid', 'code', 'status', 'message'],
  properties: {
    sid: { type: 'string' },
    code: {
      type: 'string',
      enum: favoriteErrorCodes
    },
    status: {
      type: 'string',
      enum: favoriteErrorStatuses
    },
    message: { type: 'string' }
  }
} as const
