import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from './router'
import './style.css'
import './workspace.css'
import './review.css'

createApp(App).use(createPinia()).use(createAppRouter()).mount('#app')
