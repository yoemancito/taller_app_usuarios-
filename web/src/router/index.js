import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

const routes = [
    {
        path: '/',
        name: 'home',
        redirect: () => (useAuth().isAdmin.value ? { name: 'users' } : { name: 'profile' }),
        meta: { requiresAuth: true },
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { guestOnly: true, title: 'Iniciar sesión' },
    },
    {
        path: '/registro',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { guestOnly: true, title: 'Crear cuenta' },
    },
    {
        path: '/usuarios',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Usuarios' },
    },
    {
        path: '/usuarios/nuevo',
        name: 'user-create',
        component: () => import('@/views/UserFormView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Nuevo usuario' },
    },
    {
        path: '/usuarios/:id/editar',
        name: 'user-edit',
        component: () => import('@/views/UserFormView.vue'),
        props: true,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Editar usuario' },
    },
    {
        path: '/perfil',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { requiresAuth: true, title: 'Mi perfil' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: 'Página no encontrada' },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    const auth = useAuth()
    await auth.restoreSession()

    if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
        // Si se llegó desde "/", no se guarda el destino: tras el login se decide según el rol
        const cameFromHome = to.redirectedFrom?.name === 'home'
        return { name: 'login', query: cameFromHome ? {} : { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && auth.isAuthenticated.value) {
        return { name: 'home' }
    }
    if (to.meta.requiresAdmin && !auth.isAdmin.value) {
        return { name: 'profile' }
    }
    return true
})

router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Gestión de usuarios` : 'Gestión de usuarios'
})

export default router
