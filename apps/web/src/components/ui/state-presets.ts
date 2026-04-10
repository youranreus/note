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
  primary: 'border-transparent bg-ink-900 text-white hover:-translate-y-0.5 hover:bg-ink-800',
  secondary:
    'border-[color:var(--panel-border)] bg-white/88 text-[color:var(--text-primary)] hover:-translate-y-0.5 hover:bg-white',
  danger:
    'border-transparent bg-danger text-white hover:-translate-y-0.5 hover:bg-red-700'
} as const

export const buttonStateClasses: Record<InteractionState, string> = {
  default: '',
  focus: 'ring-4 ring-accent-200',
  error: 'border-danger ring-4 ring-red-200',
  disabled: 'cursor-not-allowed border-transparent bg-ink-300 text-white opacity-70'
}

export const textInputStateClasses: Record<InteractionState, string> = {
  default: 'border-[color:var(--panel-border)] bg-white/90 text-[color:var(--text-primary)]',
  focus: 'border-accent-400 bg-white ring-4 ring-accent-100',
  error: 'border-danger bg-red-50 ring-4 ring-red-100',
  disabled: 'cursor-not-allowed border-transparent bg-ink-100 text-[color:var(--text-muted)] opacity-80'
}

export const surfaceStateClasses: Record<InteractionState, string> = {
  default: 'border-[color:var(--panel-border)] bg-[color:var(--panel-bg)]',
  focus: 'border-accent-300 bg-white ring-4 ring-accent-100',
  error: 'border-red-200 bg-red-50',
  disabled: 'border-transparent bg-white/60 opacity-70'
}
