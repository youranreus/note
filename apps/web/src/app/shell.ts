import type { InteractionState, ShellRouteDefinition } from '@note/shared-types'

export const routeShellDefinitions: ShellRouteDefinition[] = [
  {
    mode: 'online',
    path: '/note/o/:sid',
    title: '在线便签壳体',
    description: '用于后续接入在线读取、保存、收藏与权限流程。'
  },
  {
    mode: 'local',
    path: '/note/l/:sid',
    title: '本地便签壳体',
    description: '用于后续接入本地存储与离线编辑流程。'
  }
]

export const interactionStates: InteractionState[] = [
  'default',
  'focus',
  'error',
  'disabled'
]
