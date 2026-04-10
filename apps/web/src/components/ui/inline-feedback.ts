import type { InteractionState } from '@note/shared-types'

export type InlineFeedbackTone = 'info' | 'success' | 'warning' | 'danger'
export type InlineFeedbackRole = 'status' | 'alert'
export type InlineFeedbackAriaLive = 'off' | 'polite' | 'assertive'

export interface InlineFeedbackModel {
  title: string
  description: string
  tone: InlineFeedbackTone
  state: InteractionState
  id?: string
  role?: InlineFeedbackRole
  ariaLive?: InlineFeedbackAriaLive
  ariaAtomic?: boolean
}

export const politeInlineFeedbackA11y = {
  role: 'status',
  ariaLive: 'polite',
  ariaAtomic: true
} as const satisfies Pick<InlineFeedbackModel, 'role' | 'ariaLive' | 'ariaAtomic'>

export function createPoliteInlineFeedback(
  input: Omit<InlineFeedbackModel, 'role' | 'ariaLive' | 'ariaAtomic'>
): InlineFeedbackModel {
  return {
    ...input,
    ...politeInlineFeedbackA11y
  }
}
