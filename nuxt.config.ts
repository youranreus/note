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
    "@bg-dev/nuxt-naiveui",
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
  vite: {
    // plugins: [
    //   AutoImport({
    //     imports: [
    //       {
    //         'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
    //       },
    //     ],
    //   }),
    // ]
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