import { createApp } from 'vue'
import '@/style/index.css'
import App from './App.vue'
import router from '@/router/index'
import pinia from './store'
import './permission'
import i18n from './i18n'

const app = createApp(App)
app.use(i18n)
app.use(pinia)
app.use(router)
app.mount('#app')
