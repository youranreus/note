const noteReadErrorCodes = [
  'INVALID_SID',
  'NOTE_NOT_FOUND',
  'NOTE_DELETED',
  'NOTE_SID_CONFLICT'
] as const

const noteReadErrorStatuses = ['invalid-sid', 'not-found', 'deleted', 'error'] as const
const noteWriteErrorCodes = ['INVALID_SID', 'NOTE_DELETED', 'NOTE_SID_CONFLICT'] as const
const noteWriteErrorStatuses = ['invalid-sid', 'deleted', 'error'] as const

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
    }
  }
} as const

export const noteDetailResponseSchema = {
  type: 'object',
  required: ['sid', 'content', 'status'],
  properties: {
    sid: { type: 'string' },
    content: { type: 'string' },
    status: {
      type: 'string',
      enum: ['available']
    }
  }
} as const

export const noteWriteResponseSchema = {
  type: 'object',
  required: ['sid', 'content', 'status', 'saveResult'],
  properties: {
    sid: { type: 'string' },
    content: { type: 'string' },
    status: {
      type: 'string',
      enum: ['available']
    },
    saveResult: {
      type: 'string',
      enum: ['created', 'updated']
    }
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
