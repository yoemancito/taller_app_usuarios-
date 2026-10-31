<script setup>
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAuth } from '@/composables/useAuth.js'

const { isAuthenticated } = useAuth()
</script>

<template>
    <div class="layout">
        <AppHeader v-if="isAuthenticated" />

        <main class="layout__content" :class="{ 'layout__content--centered': !isAuthenticated }">
            <RouterView />
        </main>

        <ToastContainer />
    </div>
</template>
