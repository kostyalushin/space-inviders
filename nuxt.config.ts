const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-04',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    baseURL,
    head: {
      title: 'Space Inviders — маленькая игра. Большая миссия.',
      htmlAttrs: { lang: 'ru' },
      meta: [
        {
          name: 'description',
          content:
            'Ретро-аркада в браузере. Защити Землю от волн космических котят, побей свой рекорд и попробуй ещё раз.',
        },
        { name: 'theme-color', content: '#f2f1e9' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
      ],
    },
  },
})
