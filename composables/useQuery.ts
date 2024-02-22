import { merge } from 'lodash'
import { useMessage } from 'naive-ui'
import { NOTE_NOT_FOUND, TOKEN_EXPIRED } from '~/constants'

type FetchType = typeof $fetch
type ReqType = Parameters<FetchType>[0]
type FetchOptions = Parameters<FetchType>[1]

export function useQuery<T = unknown>(
  method: any,
  url: ReqType,
  body?: any,
  opts?: FetchOptions,
) {
  const { userData, token, clear, togglePanel } = useUser()
  const origin = useRuntimeConfig().public.publicUrl;
  const message = useMessage()
  const headers = {
    authorization: token.value ? `Bearer ${token.value}` : '',
    'x-user-id': userData.value.id,
  } as any

  if (process.server) {
    headers.origin = origin
  }

  const defaultOpts = {
    method,
    headers,
    body,
    onRequestError() {
      message.error('请求出错，请重试！')
    },
    onResponseError({ response, request }) {
      if (response._data.statusMessage === NOTE_NOT_FOUND) {
        return;
      }
      if (response._data.statusMessage === TOKEN_EXPIRED && response.status === 401) {
        message.error('登录已过期，请重新登陆')
        clear()
        togglePanel()
        return;
      }
      console.log('🤔 response 是 ', response)
      console.log('🤔 request 是 ',request)
      message.error('响应出错，请重试！')
    },
  } as FetchOptions

  return $fetch<T>(url, merge(defaultOpts, opts))
}

export function usePost<T = unknown>(
  request: ReqType,
  body?: any,
  opts?: FetchOptions,
) {
  return useQuery<T>('post', request, body, opts)
}

export function useGet<T = unknown>(
  request: ReqType,
  opts?: FetchOptions,
) {
  return useQuery<T>('get', request, null, opts)
}
