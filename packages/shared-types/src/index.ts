export type AuthStatus = 'anonymous' | 'authenticated' | 'recovering'

export type NoteMode = 'online' | 'local'

export type InteractionState = 'default' | 'focus' | 'error' | 'disabled'

export interface ShellRouteDefinition {
  mode: NoteMode
  path: string
  title: string
  description: string
}

export interface HealthResponse {
  ok: true
  service: 'api'
  timestamp: string
}
