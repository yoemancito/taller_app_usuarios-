<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import FormField from '@/components/FormField.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { usersApi } from '@/services/usersApi.js'
import { isValid, validateEmail, validateName, validatePassword } from '@/utils/validators.js'

// Misma vista para crear (/usuarios/nuevo) y editar (/usuarios/:id/editar)
const props = defineProps({
    id: { type: String, default: '' },
})

const router = useRouter()
const auth = useAuth()
const toast = useToast()

const isEdit = computed(() => Boolean(props.id))
const isSelf = computed(() => isEdit.value && props.id === auth.state.user?.uid)

const emptyForm = () => ({ nombre: '', email: '', password: '', rol: 'usuario' })
const form = reactive(emptyForm())
const errors = reactive({ nombre: '', email: '', password: '', rol: '' })
const serverError = ref('')
const loading = ref(false)
const notFound = ref(false)
const submitting = ref(false)

async function loadUser() {
    Object.assign(form, emptyForm())
    notFound.value = false
    if (!isEdit.value) return

    loading.value = true
    try {
        const user = await usersApi.obtener(props.id)
        Object.assign(form, { nombre: user.nombre, email: user.email, password: '', rol: user.rol })
    } catch (error) {
        // 404: no existe o fue eliminado · 400: el id no tiene formato válido
        if (error.status === 404 || error.status === 400) notFound.value = true
        else serverError.value = error.message
    } finally {
        loading.value = false
    }
}

watch(() => props.id, loadUser, { immediate: true })

function validate() {
    errors.nombre = validateName(form.nombre)
    errors.email = validateEmail(form.email)
    // Al editar, la contraseña es opcional: vacía = no se cambia
    errors.password = isEdit.value && !form.password ? '' : validatePassword(form.password)
    errors.rol = ''
    return isValid(errors)
}

async function handleSubmit() {
    serverError.value = ''
    if (!validate()) return

    const payload = { nombre: form.nombre, email: form.email, rol: form.rol }
    if (form.password) payload.password = form.password

    submitting.value = true
    try {
        if (isEdit.value) {
            const updated = await usersApi.actualizar(props.id, payload)
            if (isSelf.value) auth.setUser(updated)
            toast.success('Usuario actualizado')
        } else {
            await usersApi.crear(payload)
            toast.success('Usuario creado')
        }
        router.push({ name: 'users' })
    } catch (error) {
        // Errores por campo (express-validator) junto a cada input; si no, arriba
        if (Object.keys(error.details).length) Object.assign(errors, error.details)
        else serverError.value = error.message
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <section class="page page--narrow">
        <RouterLink :to="{ name: 'users' }" class="back-link" data-test="back-to-users">← Volver a usuarios</RouterLink>

        <header class="page__header">
            <h1>{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</h1>
        </header>

        <div v-if="notFound" class="card empty-state" data-test="user-not-found">
            <p>El usuario no existe o fue eliminado.</p>
            <RouterLink :to="{ name: 'users' }" class="btn btn--secondary">Volver al listado</RouterLink>
        </div>

        <div v-else class="card" :class="{ 'is-loading': loading }" :aria-busy="loading">
            <AlertMessage :message="serverError" />

            <form class="form" novalidate data-test="user-form" @submit.prevent="handleSubmit">
                <FormField v-model="form.nombre" label="Nombre completo" :error="errors.nombre" test-id="user-name" />
                <FormField v-model="form.email" label="Email" type="email" :error="errors.email" test-id="user-email" />
                <FormField
                    v-model="form.password"
                    :label="isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'"
                    type="password"
                    autocomplete="new-password"
                    :hint="isEdit ? 'Déjala vacía para mantener la actual' : 'Mínimo 8 caracteres, con mayúscula, minúscula y número'"
                    :error="errors.password"
                    test-id="user-password"
                />

                <div class="field" :class="{ 'field--error': errors.rol }">
                    <label class="field__label" for="user-role">Rol</label>
                    <select id="user-role" v-model="form.rol" class="field__input" :disabled="isSelf" data-test="user-role">
                        <option value="usuario">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <p v-if="errors.rol" class="field__error">{{ errors.rol }}</p>
                    <p v-else-if="isSelf" class="field__hint" data-test="self-edit-hint">No puedes cambiar tu propio rol.</p>
                </div>

                <div class="form__actions">
                    <RouterLink :to="{ name: 'users' }" class="btn btn--secondary">Cancelar</RouterLink>
                    <button type="submit" class="btn btn--primary" :disabled="submitting || loading" data-test="user-submit">
                        {{ submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>
