import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { queryClient } from './api/query-client'
import { useAuthStore } from './stores/auth'
import { logError } from './utils/error'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })

useAuthStore().hydrate()

app.use(router)

app.config.errorHandler = (error, _instance, info) => {
  logError(error, `Vue: ${info}`)
}

app.mount('#app')
