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
    'border-[#1d1d1f] bg-[#1d1d1f] text-white hover:bg-[#2c2c2e] hover:border-[#2c2c2e]',
  secondary:
    'border-[color:var(--panel-border)] bg-[color:var(--surface-white)] text-[color:var(--text-primary)] hover:bg-[#fcfcfd]',
  subtle:
    'border-transparent bg-[color:var(--subtle-fill)] text-[color:var(--text-primary)] hover:bg-[color:var(--subtle-fill-strong)]',
  danger:
    'border-transparent bg-[color:var(--danger-soft)] text-[color:var(--danger)] hover:bg-[#ffdfe2]'
} as const

export const buttonStateClasses: Record<InteractionState, string> = {
  default: '',
  focus: 'ring-2 ring-[color:var(--accent-soft)]',
  error: 'ring-2 ring-[#ffd9dd]',
  disabled: 'cursor-not-allowed opacity-55'
}

export const textInputStateClasses: Record<InteractionState, string> = {
  default: 'border-[color:var(--panel-border)] bg-[color:var(--surface-white)] text-[color:var(--text-primary)]',
  focus: 'border-[color:var(--accent)] bg-[color:var(--surface-white)] ring-2 ring-[color:var(--accent-soft)]',
  error: 'border-[color:var(--danger)] bg-[#fff7f8] ring-2 ring-[#ffd9dd]',
  disabled:
    'cursor-not-allowed border-[color:var(--panel-border)] bg-[#f2f2f7] text-[color:var(--text-muted)] opacity-80'
}

export const surfaceStateClasses: Record<InteractionState, string> = {
  default: 'border-[color:var(--panel-border)] bg-[color:var(--panel-bg)]',
  focus: 'border-[color:var(--accent)] bg-[color:var(--panel-bg)] ring-2 ring-[color:var(--accent-soft)]',
  error: 'border-[#ffd9dd] bg-[#fff7f8]',
  disabled: 'border-[color:var(--panel-border)] bg-[#f2f2f7] opacity-70'
}
