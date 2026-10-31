<script setup>
import { computed } from 'vue'

const props = defineProps({
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    total: { type: Number, required: true },
    limit: { type: Number, required: true },
})

const emit = defineEmits(['change'])

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const to = computed(() => Math.min(props.page * props.limit, props.total))
</script>

<template>
    <nav class="pagination" aria-label="Paginación">
        <p class="pagination__info" data-test="pagination-info">
            Mostrando {{ from }}–{{ to }} de {{ total }}
        </p>

        <div class="pagination__controls">
            <button
                type="button"
                class="btn btn--secondary btn--sm"
                :disabled="page <= 1"
                data-test="pagination-prev"
                @click="emit('change', page - 1)"
            >
                ← Anterior
            </button>
            <span class="pagination__page" data-test="pagination-page">Página {{ page }} de {{ totalPages }}</span>
            <button
                type="button"
                class="btn btn--secondary btn--sm"
                :disabled="page >= totalPages"
                data-test="pagination-next"
                @click="emit('change', page + 1)"
            >
                Siguiente →
            </button>
        </div>
    </nav>
</template>
