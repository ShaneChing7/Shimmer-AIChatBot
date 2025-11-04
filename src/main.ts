import { createApp } from 'vue'
import '@/style/index.css'
import App from './App.vue'
import router from '@/router/index'
import pinia from './store'
import './permission'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
