import { reactive, readonly } from 'vue'

const toasts = reactive([])
let nextId = 1

/** Notificaciones breves en la esquina de la pantalla. */
export function useToast() {
    function dismiss(id) {
        const index = toasts.findIndex((toast) => toast.id === id)
        if (index !== -1) toasts.splice(index, 1)
    }

    function show(message, type = 'success', duration = 3500) {
        const id = nextId++
        toasts.push({ id, message, type })
        if (duration) setTimeout(() => dismiss(id), duration)
        return id
    }

    return {
        toasts: readonly(toasts),
        success: (message) => show(message, 'success'),
        error: (message) => show(message, 'error', 5000),
        dismiss,
    }
}
