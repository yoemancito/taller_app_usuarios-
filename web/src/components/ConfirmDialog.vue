<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, default: '¿Estás seguro?' },
    message: { type: String, default: '' },
    confirmText: { type: String, default: 'Confirmar' },
    loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
const cancelButton = ref(null)

// Al abrir, el foco va a "Cancelar": la opción segura por defecto
watch(
    () => props.open,
    async (isOpen) => {
        if (isOpen) {
            await nextTick()
            cancelButton.value?.focus()
        }
    },
)

function onKeydown(event) {
    if (event.key === 'Escape' && !props.loading) emit('cancel')
}
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="open" class="dialog-backdrop" @click.self="!loading && emit('cancel')" @keydown="onKeydown">
                <div
                    class="dialog"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="dialog-title"
                    aria-describedby="dialog-message"
                    data-test="confirm-dialog"
                >
                    <h2 id="dialog-title" class="dialog__title">{{ title }}</h2>
                    <p id="dialog-message" class="dialog__message">{{ message }}</p>

                    <div class="dialog__actions">
                        <button
                            ref="cancelButton"
                            type="button"
                            class="btn btn--secondary"
                            :disabled="loading"
                            data-test="confirm-cancel"
                            @click="emit('cancel')"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="btn btn--danger"
                            :disabled="loading"
                            data-test="confirm-accept"
                            @click="emit('confirm')"
                        >
                            {{ loading ? 'Procesando…' : confirmText }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
