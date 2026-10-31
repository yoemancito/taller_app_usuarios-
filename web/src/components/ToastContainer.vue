<script setup>
import { useToast } from '@/composables/useToast.js'

const { toasts, dismiss } = useToast()
</script>

<template>
    <div class="toasts" aria-live="polite">
        <TransitionGroup name="toast">
            <div
                v-for="toast in toasts"
                :key="toast.id"
                class="toast"
                :class="`toast--${toast.type}`"
                role="status"
                data-test="toast"
            >
                <span>{{ toast.message }}</span>
                <button type="button" class="toast__close" aria-label="Cerrar notificación" @click="dismiss(toast.id)">
                    ×
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
