// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      publicUrl: '',
    },
    ssoUrl: '',
    ssoId: '',
    ssoSecret: '',
    ssoRedirect: '',
    sessionPassword: '',
  },
  devtools: { enabled: false },
  ssr: true,
  css: [
    '@reus-able/theme/tokens',
    'assets/global.css',
  ],
  modules: [
    '@nuxt/ui',
    [
      '@pinia/nuxt',
      {
        autoImports: ['defineStore', 'storeToRefs'],
      },
    ],
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],
  app: {
    head: {
      title: 'Memo',
      meta: [
        { name: 'description', content: '季悠然の便签' },
        { name: 'keywords', content: 'nuxt,vue,ts,note' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
})
