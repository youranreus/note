import { NOTE_NOT_FOUND, TOKEN_EXPIRED } from '~/constants'

export function useRequest() {
  const { user, clear: clearSession } = useUserSession()
  const toast = useToast()

  const request = <T = unknown>(
    url: string,
    opts: Parameters<typeof $fetch>[1] = {},
  ) => {
    return $fetch<T>(url, {
      ...opts,
      onResponseError({ response }) {
        const msg = response._data?.statusMessage
        if (msg === NOTE_NOT_FOUND) return
        if (msg === TOKEN_EXPIRED || response.status === 401) {
          toast.add({ title: '登录已过期，请重新登录', color: 'error' })
          clearSession()
          return
        }
        toast.add({ title: '请求失败，请重试', color: 'error' })
      },
    })
  }

  const get = <T = unknown>(url: string, opts?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { method: 'GET', ...opts })

  const post = <T = unknown>(url: string, body?: any, opts?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { method: 'POST', body, ...opts })

  const del = <T = unknown>(url: string, opts?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { method: 'DELETE', ...opts })

  return { get, post, del }
}
