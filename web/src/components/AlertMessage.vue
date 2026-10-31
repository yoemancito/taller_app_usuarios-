<script setup>
defineProps({
    type: { type: String, default: 'error' }, // error | success | info
    message: { type: String, default: '' },
})
</script>

<template>
    <div v-if="message" class="alert" :class="`alert--${type}`" role="alert" data-test="alert">
        {{ message }}
    </div>
</template>
