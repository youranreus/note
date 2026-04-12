import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { setupIonicons } from './app/ionicons'
import './app/styles/index.css'
import { createAppRouter } from './router'

setupIonicons()

const app = createApp(App)

app.use(createPinia())
app.use(createAppRouter())
app.mount('#app')
