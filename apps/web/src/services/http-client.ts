import { axiosRequestAdapter } from '@alova/adapter-axios'
import { createAlova } from 'alova'
import VueHook from 'alova/vue'
import axios from 'axios'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true
})

export const alovaClient = createAlova({
  baseURL: apiBaseUrl,
  statesHook: VueHook,
  requestAdapter: axiosRequestAdapter({
    axios: axiosClient
  })
})

export function resolveCallbackUrl() {
  return import.meta.env.VITE_SSO_REDIRECT ?? '/auth/callback'
}
