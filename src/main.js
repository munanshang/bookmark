import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'

// 引入NaiveUI
import naive from 'naive-ui'

// 创建路由
const routes = [
  { path: '/', component: MainView },
  { path: '/settings', component: SettingsView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 创建Vue应用
const app = createApp(App)
app.use(router)
app.use(naive)  // 使用NaiveUI
app.mount('#app')