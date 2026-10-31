import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { useAuth } from './composables/useAuth.js'
import { useToast } from './composables/useToast.js'
import { setUnauthorizedHandler } from './services/http.js'
import './assets/main.css'

// Si la API responde 401 con un token guardado (expiró o el usuario fue
// desactivado), se cierra la sesión y se vuelve al login.
setUnauthorizedHandler(() => {
    useAuth().clearSession()
    useToast().error('Tu sesión ha terminado. Vuelve a iniciar sesión.')
    const current = router.currentRoute.value
    if (current.name !== 'login') {
        router.push({ name: 'login', query: { redirect: current.fullPath } })
    }
})

createApp(App).use(router).mount('#app')
