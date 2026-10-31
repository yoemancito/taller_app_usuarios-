<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

const router = useRouter()
const { state, isAdmin, logout } = useAuth()
const menuOpen = ref(false)

const initials = computed(() =>
    (state.user?.nombre ?? '')
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
)

function handleLogout() {
    logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <header class="header">
        <div class="header__inner">
            <RouterLink :to="{ name: 'home' }" class="header__brand">
                <span class="header__logo" aria-hidden="true">GU</span>
                Gestión de usuarios
            </RouterLink>

            <button
                type="button"
                class="header__toggle"
                :aria-expanded="menuOpen"
                aria-controls="main-nav"
                aria-label="Abrir menú"
                @click="menuOpen = !menuOpen"
            >
                <span></span><span></span><span></span>
            </button>

            <nav id="main-nav" class="header__nav" :class="{ 'header__nav--open': menuOpen }" @click="menuOpen = false">
                <RouterLink v-if="isAdmin" :to="{ name: 'users' }" class="header__link" data-test="nav-users">
                    Usuarios
                </RouterLink>
                <RouterLink :to="{ name: 'profile' }" class="header__link" data-test="nav-profile">
                    Mi perfil
                </RouterLink>

                <div class="header__user">
                    <span class="avatar" aria-hidden="true">{{ initials }}</span>
                    <span class="header__user-info">
                        <strong data-test="current-user-name">{{ state.user?.nombre }}</strong>
                        <small>{{ isAdmin ? 'Administrador' : 'Usuario' }}</small>
                    </span>
                </div>

                <button type="button" class="btn btn--ghost" data-test="logout" @click="handleLogout">
                    Cerrar sesión
                </button>
            </nav>
        </div>
    </header>
</template>
