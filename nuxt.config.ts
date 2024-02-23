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
          "defineStore",
          "storeToRefs"
        ],
      },
    ],
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
  ],
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