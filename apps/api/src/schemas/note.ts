const noteReadErrorCodes = [
  'INVALID_SID',
  'NOTE_NOT_FOUND',
  'NOTE_DELETED',
  'NOTE_SID_CONFLICT'
] as const

const noteReadErrorStatuses = ['invalid-sid', 'not-found', 'deleted', 'error'] as const
const noteEditAccessValues = [
  'owner-editable',
  'anonymous-editable',
  'key-required',
  'key-editable',
  'forbidden'
] as const
const noteFavoriteStateValues = ['not-favorited', 'favorited', 'self-owned'] as const
const noteWriteErrorCodes = [
  'INVALID_SID',
  'NOTE_DELETED',
  'NOTE_EDIT_KEY_ACTION_INVALID',
  'NOTE_EDIT_KEY_REQUIRED',
  'NOTE_EDIT_KEY_INVALID',
  'NOTE_FORBIDDEN',
  'NOTE_SID_CONFLICT'
] as const
const noteWriteErrorStatuses = ['invalid-sid', 'deleted', 'forbidden', 'error'] as const
const noteDeleteErrorCodes = [
  'INVALID_SID',
  'NOTE_NOT_FOUND',
  'NOTE_DELETED',
  'NOTE_EDIT_KEY_REQUIRED',
  'NOTE_EDIT_KEY_INVALID',
  'NOTE_FORBIDDEN',
  'NOTE_SID_CONFLICT'
] as const
const noteDeleteErrorStatuses = ['invalid-sid', 'not-found', 'deleted', 'forbidden', 'error'] as const

export const noteReadParamsSchema = {
  type: 'object',
  required: ['sid'],
  properties: {
    sid: {
      type: 'string',
      minLength: 1
    }
  }
} as const

export const noteWriteBodySchema = {
  type: 'object',
  required: ['content'],
  properties: {
    content: {
      type: 'string'
    },
    editKey: {
      type: 'string',
      maxLength: 128
    },
    editKeyAction: {
      type: 'string',
      enum: ['none', 'set', 'use']
    }
  }
} as const

export const noteReadHeadersSchema = {
  type: 'object',
  properties: {
    'x-note-edit-key': {
      type: 'string',
      maxLength: 128
    }
  }
} as const

export const noteDetailResponseSchema = {
  type: 'object',
  required: ['sid', 'content', 'status', 'editAccess', 'favoriteState'],
  properties: {
    sid: { type: 'string' },
    content: { type: 'string' },
    status: {
      type: 'string',
      enum: ['available']
    },
    editAccess: {
      type: 'string',
      enum: noteEditAccessValues
    },
    favoriteState: {
      type: 'string',
      enum: noteFavoriteStateValues
    }
  }
} as const

export const noteWriteResponseSchema = {
  type: 'object',
  required: ['sid', 'content', 'status', 'editAccess', 'favoriteState', 'saveResult'],
  properties: {
    sid: { type: 'string' },
    content: { type: 'string' },
    status: {
      type: 'string',
      enum: ['available']
    },
    editAccess: {
      type: 'string',
      enum: noteEditAccessValues
    },
    favoriteState: {
      type: 'string',
      enum: noteFavoriteStateValues
    },
    saveResult: {
      type: 'string',
      enum: ['created', 'updated']
    }
  }
} as const

export const noteDeleteResponseSchema = {
  type: 'object',
  required: ['sid', 'status', 'message'],
  properties: {
    sid: { type: 'string' },
    status: {
      type: 'string',
      enum: ['deleted']
    },
    message: { type: 'string' }
  }
} as const

export const noteReadErrorSchema = {
  type: 'object',
  required: ['sid', 'code', 'status', 'message'],
  properties: {
    sid: { type: 'string' },
    code: {
      type: 'string',
      enum: noteReadErrorCodes
    },
    status: {
      type: 'string',
      enum: noteReadErrorStatuses
    },
    message: { type: 'string' }
  }
} as const

export const noteWriteErrorSchema = {
  type: 'object',
  required: ['sid', 'code', 'status', 'message'],
  properties: {
    sid: { type: 'string' },
    code: {
      type: 'string',
      enum: noteWriteErrorCodes
    },
    status: {
      type: 'string',
      enum: noteWriteErrorStatuses
    },
    message: { type: 'string' }
  }
} as const

export const noteDeleteErrorSchema = {
  type: 'object',
  required: ['sid', 'code', 'status', 'message'],
  properties: {
    sid: { type: 'string' },
    code: {
      type: 'string',
      enum: noteDeleteErrorCodes
    },
    status: {
      type: 'string',
      enum: noteDeleteErrorStatuses
    },
    message: { type: 'string' }
  }
} as const
