<script setup>
import { computed, reactive, ref } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import FormField from '@/components/FormField.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { authApi } from '@/services/authApi.js'
import {
    isValid,
    validateEmail,
    validateName,
    validatePassword,
    validatePasswordConfirmation,
} from '@/utils/validators.js'

const auth = useAuth()
const toast = useToast()
const user = computed(() => auth.state.user)
const memberSince = computed(() =>
    user.value ? new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(user.value.createdAt)) : '',
)

// --- Datos personales ---
const profile = reactive({ nombre: user.value?.nombre ?? '', email: user.value?.email ?? '' })
const profileErrors = reactive({ nombre: '', email: '' })
const profileServerError = ref('')
const savingProfile = ref(false)

async function saveProfile() {
    profileServerError.value = ''
    profileErrors.nombre = validateName(profile.nombre)
    profileErrors.email = validateEmail(profile.email)
    if (!isValid(profileErrors)) return

    savingProfile.value = true
    try {
        const updated = await authApi.actualizarPerfil({ nombre: profile.nombre, email: profile.email })
        auth.setUser(updated)
        Object.assign(profile, { nombre: updated.nombre, email: updated.email })
        toast.success('Perfil actualizado')
    } catch (error) {
        if (Object.keys(error.details).length) Object.assign(profileErrors, error.details)
        else profileServerError.value = error.message
    } finally {
        savingProfile.value = false
    }
}

// --- Cambio de contraseña ---
const emptyPasswords = () => ({ currentPassword: '', newPassword: '', confirmation: '' })
const passwords = reactive(emptyPasswords())
const passwordErrors = reactive(emptyPasswords())
const passwordServerError = ref('')
const savingPassword = ref(false)

async function changePassword() {
    passwordServerError.value = ''
    passwordErrors.currentPassword = passwords.currentPassword ? '' : 'Escribe tu contraseña actual'
    passwordErrors.newPassword = validatePassword(passwords.newPassword)
    passwordErrors.confirmation = validatePasswordConfirmation(passwords.newPassword, passwords.confirmation)
    if (!isValid(passwordErrors)) return

    savingPassword.value = true
    try {
        await authApi.cambiarPassword({
            passwordActual: passwords.currentPassword,
            passwordNueva: passwords.newPassword,
        })
        Object.assign(passwords, emptyPasswords())
        toast.success('Contraseña actualizada')
    } catch (error) {
        if (error.details.passwordNueva) passwordErrors.newPassword = error.details.passwordNueva
        else passwordServerError.value = error.message
    } finally {
        savingPassword.value = false
    }
}
</script>

<template>
    <section class="page page--narrow">
        <header class="page__header">
            <div class="profile-heading">
                <span class="avatar avatar--lg" aria-hidden="true">{{ user?.nombre?.[0]?.toUpperCase() }}</span>
                <div>
                    <h1>Mi perfil</h1>
                    <p class="text-muted">
                        <span class="badge" :class="user?.rol === 'admin' ? 'badge--primary' : 'badge--neutral'" data-test="profile-role">
                            {{ user?.rol === 'admin' ? 'Administrador' : 'Usuario' }}
                        </span>
                        Miembro desde {{ memberSince }}
                    </p>
                </div>
            </div>
        </header>

        <div class="card">
            <h2 class="card__title">Datos personales</h2>
            <AlertMessage :message="profileServerError" />
            <form class="form" novalidate data-test="profile-form" @submit.prevent="saveProfile">
                <FormField v-model="profile.nombre" label="Nombre completo" :error="profileErrors.nombre" test-id="profile-name" />
                <FormField v-model="profile.email" label="Email" type="email" :error="profileErrors.email" test-id="profile-email" />
                <div class="form__actions">
                    <button type="submit" class="btn btn--primary" :disabled="savingProfile" data-test="profile-submit">
                        {{ savingProfile ? 'Guardando…' : 'Guardar cambios' }}
                    </button>
                </div>
            </form>
        </div>

        <div class="card">
            <h2 class="card__title">Cambiar contraseña</h2>
            <AlertMessage :message="passwordServerError" />
            <form class="form" novalidate data-test="password-form" @submit.prevent="changePassword">
                <FormField
                    v-model="passwords.currentPassword"
                    label="Contraseña actual"
                    type="password"
                    autocomplete="current-password"
                    :error="passwordErrors.currentPassword"
                    test-id="password-current"
                />
                <FormField
                    v-model="passwords.newPassword"
                    label="Nueva contraseña"
                    type="password"
                    autocomplete="new-password"
                    hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
                    :error="passwordErrors.newPassword"
                    test-id="password-new"
                />
                <FormField
                    v-model="passwords.confirmation"
                    label="Repite la nueva contraseña"
                    type="password"
                    autocomplete="new-password"
                    :error="passwordErrors.confirmation"
                    test-id="password-confirmation"
                />
                <div class="form__actions">
                    <button type="submit" class="btn btn--primary" :disabled="savingPassword" data-test="password-submit">
                        {{ savingPassword ? 'Actualizando…' : 'Actualizar contraseña' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>
