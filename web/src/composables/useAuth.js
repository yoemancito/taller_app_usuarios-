import { computed, reactive, readonly } from 'vue'
import { authApi } from '@/services/authApi.js'
import { tokenStorage } from '@/services/http.js'

// Estado global de la sesión: un único objeto reactivo compartido por toda la app
const state = reactive({
    user: null,
    token: tokenStorage.get(),
    loaded: false, // ¿ya se comprobó el token guardado contra la API?
})

function startSession({ token, usuario }) {
    tokenStorage.set(token)
    state.token = token
    state.user = usuario
    state.loaded = true
}

function clearSession() {
    tokenStorage.clear()
    state.token = null
    state.user = null
    state.loaded = true
}

export function useAuth() {
    const isAuthenticated = computed(() => Boolean(state.token && state.user))
    const isAdmin = computed(() => state.user?.rol === 'admin')

    async function login(credentials) {
        startSession(await authApi.login(credentials))
    }

    async function register(data) {
        startSession(await authApi.registro(data))
    }

    function logout() {
        clearSession()
    }

    /** Recupera el usuario del token guardado (al recargar la página). */
    async function restoreSession() {
        if (state.loaded) return
        if (!state.token) {
            state.loaded = true
            return
        }
        try {
            state.user = await authApi.perfil()
            state.loaded = true
        } catch {
            clearSession()
        }
    }

    function setUser(user) {
        state.user = user
    }

    return {
        state: readonly(state),
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        restoreSession,
        setUser,
        clearSession,
    }
}
