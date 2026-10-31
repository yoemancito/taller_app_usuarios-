<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import FormField from '@/components/FormField.vue'
import { useAuth } from '@/composables/useAuth.js'
import { isValid, validateEmail } from '@/utils/validators.js'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const serverError = ref('')
const submitting = ref(false)

function validate() {
    errors.email = validateEmail(form.email)
    errors.password = form.password ? '' : 'La contraseña es obligatoria'
    return isValid(errors)
}

async function handleSubmit() {
    serverError.value = ''
    if (!validate()) return

    submitting.value = true
    try {
        await login({ email: form.email, password: form.password })
        // Vuelve a la página que se intentaba abrir, si era una ruta interna
        const target = route.query.redirect
        const isInternal = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
        const redirect = isInternal ? target : { name: 'home' }
        router.push(redirect)
    } catch (error) {
        serverError.value = error.message
        form.password = ''
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <section class="auth-card">
        <header class="auth-card__header">
            <span class="auth-card__logo" aria-hidden="true">GU</span>
            <h1>Iniciar sesión</h1>
            <p class="text-muted">Accede para gestionar tu cuenta</p>
        </header>

        <AlertMessage :message="serverError" />

        <form class="form" novalidate data-test="login-form" @submit.prevent="handleSubmit">
            <FormField
                v-model="form.email"
                label="Email"
                type="email"
                autocomplete="email"
                placeholder="tu@email.com"
                :error="errors.email"
                test-id="login-email"
            />
            <FormField
                v-model="form.password"
                label="Contraseña"
                type="password"
                autocomplete="current-password"
                :error="errors.password"
                test-id="login-password"
            />

            <button type="submit" class="btn btn--primary btn--block" :disabled="submitting" data-test="login-submit">
                {{ submitting ? 'Entrando…' : 'Entrar' }}
            </button>
        </form>

        <p class="auth-card__footer">
            ¿No tienes cuenta?
            <RouterLink :to="{ name: 'register' }" data-test="go-register">Crea una</RouterLink>
        </p>

        <aside class="demo-box" aria-label="Cuentas de prueba">
            <strong>Cuentas de prueba</strong>
            <span>Admin: <code>admin@demo.com</code> / <code>Admin123!</code></span>
            <span>Usuario: <code>ana@demo.com</code> / <code>Usuario123</code></span>
        </aside>
    </section>
</template>
