import type { InteractionState } from '@note/shared-types'

export const foundationStateRegistry: Record<string, InteractionState[]> = {
  Button: ['default', 'focus', 'error', 'disabled'],
  TextInput: ['default', 'focus', 'error', 'disabled'],
  Modal: ['default', 'focus', 'error', 'disabled'],
  SegmentedTabs: ['default', 'focus', 'error', 'disabled'],
  StatusPill: ['default', 'focus', 'error', 'disabled'],
  ListItem: ['default', 'focus', 'error', 'disabled'],
  InlineFeedback: ['default', 'focus', 'error', 'disabled'],
  LoadingCard: ['default', 'focus', 'error', 'disabled'],
  EmptyState: ['default', 'focus', 'error', 'disabled'],
  SurfaceCard: ['default', 'focus', 'error', 'disabled']
}

export const buttonVariantClasses = {
  primary:
    'border-transparent bg-[color:var(--accent)] text-white hover:bg-[#3150ff] active:bg-[#2946eb]',
  secondary:
    'border-[color:var(--control-border)] bg-[color:var(--control-fill)] text-[color:var(--text-primary)] hover:border-[color:var(--control-border-strong)] hover:bg-white active:bg-[#f4f6fb]',
  subtle:
    'border-transparent bg-[color:var(--subtle-fill)] text-[color:var(--text-primary)] hover:bg-[color:var(--subtle-fill-strong)] active:bg-[#dddfe8]',
  danger:
    'border-transparent bg-[color:var(--danger-soft)] text-[color:var(--danger)] hover:bg-[#ffe6ea] active:bg-[#ffd8de]'
} as const

export const buttonStateClasses: Record<InteractionState, string> = {
  default: '',
  focus: 'ring-2 ring-[color:var(--accent-soft)] ring-offset-2 ring-offset-[color:var(--shell-bg)]',
  error: 'ring-2 ring-[#ffe2e6] ring-offset-2 ring-offset-[color:var(--shell-bg)]',
  disabled: 'pointer-events-none cursor-not-allowed opacity-50 saturate-75'
}

export const textInputStateClasses: Record<InteractionState, string> = {
  default:
    'border-[color:var(--control-border)] bg-[color:var(--control-fill)] text-[color:var(--text-primary)] hover:border-[color:var(--control-border-strong)]',
  focus: 'border-[color:var(--accent)] bg-[color:var(--surface-white)] ring-2 ring-[color:var(--accent-soft)]',
  error: 'border-[color:var(--danger)] bg-[#fff8f9] ring-2 ring-[#ffe2e6]',
  disabled:
    'cursor-not-allowed border-transparent bg-[#f3f4f8] text-[color:var(--text-muted)] opacity-80'
}

export const surfaceStateClasses: Record<InteractionState, string> = {
  default: 'border-[color:var(--control-border)] bg-[color:var(--panel-bg)]',
  focus: 'border-[color:var(--accent)] bg-[color:var(--panel-bg)] ring-2 ring-[color:var(--accent-soft)]',
  error: 'border-[#ffe2e6] bg-[#fff8f9]',
  disabled: 'border-[color:var(--panel-border)] bg-[#f2f2f7] opacity-70'
}
