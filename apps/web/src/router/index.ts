import type { RouteRecordRaw, RouterHistory } from 'vue-router'

import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import { routeShellDefinitions } from '@/app/shell'
import AuthCallbackView from '@/views/AuthCallbackView.vue'
import HomeView from '@/views/HomeView.vue'
import LocalNoteView from '@/views/LocalNoteView.vue'
import OnlineNoteView from '@/views/OnlineNoteView.vue'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: AuthCallbackView
  },
  ...routeShellDefinitions.flatMap<RouteRecordRaw>((definition) => {
    const isOnline = definition.mode === 'online'
    const component = isOnline ? OnlineNoteView : LocalNoteView
    const meta = {
      title: definition.title,
      description: definition.description
    }

    return [
      {
        path: definition.path,
        name: isOnline ? 'online-note' : 'local-note',
        component,
        meta
      },
      {
        path: isOnline ? '/note/o' : '/note/l',
        name: isOnline ? 'online-note-missing-sid' : 'local-note-missing-sid',
        component,
        meta
      }
    ]
  })
]

export function createAppRouter(options?: { history?: RouterHistory }) {
  const history =
    options?.history ??
    (typeof window === 'undefined'
      ? createMemoryHistory()
      : createWebHistory(import.meta.env.BASE_URL))

  return createRouter({
    history,
    routes: appRoutes
  })
}
