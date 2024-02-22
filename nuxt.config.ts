import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      configHost: '',
      ssoHost: '',
      ssoKey: '',
      publicUrl: '',
    },
    ssoApi: '',
  },
  devtools: { enabled: false },
  ssr: true,
  css: [
    'assets/global.css',
  ],
  modules: [
    '@nuxtjs/tailwindcss',
    [
      "@pinia/nuxt",
      {
        autoImports: [
          // 自动引入 `defineStore(), storeToRefs()`
          "defineStore",
          "storeToRefs"
        ],
      },
    ],
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
  ],
  build: {
    transpile:
      process.env.NODE_ENV === 'production'
        ? [
            'naive-ui',
            'vueuc',
            '@css-render/vue3-ssr',
            '@juggle/resize-observer'
          ]
        : ['@juggle/resize-observer']
  },
  vite: {
    optimizeDeps: {
      include:
        process.env.NODE_ENV === 'development'
          ? ['naive-ui', 'vueuc', 'date-fns-tz/formatInTimeZone']
          : []
    },
    plugins: [
      AutoImport({
        imports: [
          {
            'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ]
  },
  app: {
    head: {
      title: "Memo",
      meta: [
        { name: "description", content: "季悠然の便签" },
        { name: "keywords", content: "nuxt,vue,ts,note" },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    },
  }
})