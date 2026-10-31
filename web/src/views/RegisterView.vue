<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import FormField from '@/components/FormField.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import {
    isValid,
    validateEmail,
    validateName,
    validatePassword,
    validatePasswordConfirmation,
} from '@/utils/validators.js'

const router = useRouter()
const { register } = useAuth()
const toast = useToast()

const form = reactive({ nombre: '', email: '', password: '', confirmation: '' })
const errors = reactive({ nombre: '', email: '', password: '', confirmation: '' })
const serverError = ref('')
const submitting = ref(false)

function validate() {
    errors.nombre = validateName(form.nombre)
    errors.email = validateEmail(form.email)
    errors.password = validatePassword(form.password)
    errors.confirmation = validatePasswordConfirmation(form.password, form.confirmation)
    return isValid(errors)
}

async function handleSubmit() {
    serverError.value = ''
    if (!validate()) return

    submitting.value = true
    try {
        await register({ nombre: form.nombre, email: form.email, password: form.password })
        toast.success('¡Cuenta creada! Bienvenido.')
        router.push({ name: 'home' })
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
    <section class="auth-card">
        <header class="auth-card__header">
            <span class="auth-card__logo" aria-hidden="true">GU</span>
            <h1>Crear cuenta</h1>
            <p class="text-muted">Regístrate para acceder a tu perfil</p>
        </header>

        <AlertMessage :message="serverError" />

        <form class="form" novalidate data-test="register-form" @submit.prevent="handleSubmit">
            <FormField
                v-model="form.nombre"
                label="Nombre completo"
                autocomplete="name"
                :error="errors.nombre"
                test-id="register-name"
            />
            <FormField
                v-model="form.email"
                label="Email"
                type="email"
                autocomplete="email"
                placeholder="tu@email.com"
                :error="errors.email"
                test-id="register-email"
            />
            <FormField
                v-model="form.password"
                label="Contraseña"
                type="password"
                autocomplete="new-password"
                hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
                :error="errors.password"
                test-id="register-password"
            />
            <FormField
                v-model="form.confirmation"
                label="Repite la contraseña"
                type="password"
                autocomplete="new-password"
                :error="errors.confirmation"
                test-id="register-confirmation"
            />

            <button type="submit" class="btn btn--primary btn--block" :disabled="submitting" data-test="register-submit">
                {{ submitting ? 'Creando cuenta…' : 'Crear cuenta' }}
            </button>
        </form>

        <p class="auth-card__footer">
            ¿Ya tienes cuenta?
            <RouterLink :to="{ name: 'login' }" data-test="go-login">Inicia sesión</RouterLink>
        </p>
    </section>
</template>
