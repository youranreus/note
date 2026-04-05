import type { AuthCallbackResponseDto, SessionResponseDto } from '@note/shared-types'

import { normalizeAuthReturnToPath } from '@note/shared-types'

import { axiosClient, apiBaseUrl } from './http-client'

export function createAuthLoginUrl(returnTo: string) {
  const loginUrl = new URL('/api/auth/login', apiBaseUrl)

  loginUrl.searchParams.set('returnTo', normalizeAuthReturnToPath(returnTo, '/'))

  return loginUrl.toString()
}

export async function completeAuthCallback(input: {
  code: string
  state: string
}) {
  const response = await axiosClient.get<AuthCallbackResponseDto>('/api/auth/callback', {
    params: input
  })

  return response.data
}

export async function fetchSession() {
  const response = await axiosClient.get<SessionResponseDto>('/api/me/session')

  return response.data
}

export function redirectToLogin(url: string) {
  window.location.assign(url)
}
