<script setup>
import { computed, ref, useId } from 'vue'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
    autocomplete: { type: String, default: 'off' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    testId: { type: String, default: '' },
})

const id = useId()
const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))
const describedBy = computed(() => {
    if (props.error) return `${id}-error`
    if (props.hint) return `${id}-hint`
    return undefined
})
</script>

<template>
    <div class="field" :class="{ 'field--error': error }">
        <label class="field__label" :for="id">{{ label }}</label>

        <div class="field__control">
            <input
                :id="id"
                v-model="model"
                class="field__input"
                :type="inputType"
                :autocomplete="autocomplete"
                :placeholder="placeholder"
                :disabled="disabled"
                :aria-invalid="Boolean(error)"
                :aria-describedby="describedBy"
                :data-test="testId || undefined"
            />
            <button
                v-if="isPassword"
                type="button"
                class="field__reveal"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :data-test="testId ? `${testId}-toggle` : undefined"
                @click="showPassword = !showPassword"
            >
                {{ showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
        </div>

        <p v-if="error" :id="`${id}-error`" class="field__error" :data-test="testId ? `${testId}-error` : undefined">
            {{ error }}
        </p>
        <p v-else-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
    </div>
</template>
