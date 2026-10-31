<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { usersApi } from '@/services/usersApi.js'

const LIMITE = 8
const SEARCH_DELAY_MS = 300

const route = useRoute()
const router = useRouter()
const { state } = useAuth()
const toast = useToast()

const result = ref({ usuarios: [], total: 0, pagina: 1, limite: LIMITE, totalPaginas: 1 })
const loading = ref(false)
const loadError = ref('')

// Los filtros viven en la URL (?buscar=&rol=&pagina=): se pueden compartir y sobreviven a recargar
const search = ref(String(route.query.buscar ?? ''))
const role = computed({
    get: () => String(route.query.rol ?? ''),
    set: (value) => updateQuery({ rol: value || undefined, pagina: undefined }),
})
const page = computed(() => Number(route.query.pagina) || 1)

const userToDelete = ref(null)
const deleting = ref(false)

const hasFilters = computed(() => Boolean(route.query.buscar || route.query.rol))
const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })

function updateQuery(changes) {
    router.replace({ query: { ...route.query, ...changes } })
}

async function loadUsers() {
    loading.value = true
    loadError.value = ''
    try {
        result.value = await usersApi.listar({
            buscar: route.query.buscar,
            rol: route.query.rol,
            pagina: page.value,
            limite: LIMITE,
        })
        // Si se eliminó el último usuario de la última página, retrocede una
        if (result.value.usuarios.length === 0 && page.value > 1) {
            updateQuery({ pagina: page.value - 1 })
        }
    } catch (error) {
        loadError.value = error.message
    } finally {
        loading.value = false
    }
}

watch(
    () => route.query,
    () => {
        // Al salir de la vista la ruta cambia antes de desmontarse: no recargar
        if (route.name === 'users') loadUsers()
    },
    { immediate: true },
)

let searchTimer
watch(search, (value) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => updateQuery({ buscar: value.trim() || undefined, pagina: undefined }), SEARCH_DELAY_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function clearFilters() {
    search.value = ''
    clearTimeout(searchTimer)
    router.replace({ query: {} })
}

function changePage(newPage) {
    updateQuery({ pagina: newPage > 1 ? newPage : undefined })
}

async function confirmDelete() {
    deleting.value = true
    try {
        await usersApi.eliminar(userToDelete.value.uid)
        toast.success(`Usuario ${userToDelete.value.nombre} eliminado`)
        userToDelete.value = null
        await loadUsers()
    } catch (error) {
        toast.error(error.message)
    } finally {
        deleting.value = false
    }
}

const isSelf = (user) => user.uid === state.user?.uid
const formatDate = (iso) => dateFormatter.format(new Date(iso))
</script>

<template>
    <section class="page">
        <header class="page__header">
            <div>
                <h1>Usuarios</h1>
                <p class="text-muted" data-test="users-total">{{ result.total }} usuarios activos</p>
            </div>
            <RouterLink :to="{ name: 'user-create' }" class="btn btn--primary" data-test="users-new">
                + Nuevo usuario
            </RouterLink>
        </header>

        <div class="card">
            <div class="toolbar">
                <label class="toolbar__search">
                    <span class="sr-only">Buscar usuarios</span>
                    <input
                        v-model="search"
                        type="search"
                        class="field__input"
                        placeholder="Buscar por nombre o email…"
                        data-test="users-search"
                    />
                </label>

                <label class="toolbar__filter">
                    <span class="sr-only">Filtrar por rol</span>
                    <select v-model="role" class="field__input" data-test="users-role-filter">
                        <option value="">Todos los roles</option>
                        <option value="admin">Administradores</option>
                        <option value="usuario">Usuarios</option>
                    </select>
                </label>

                <button v-if="hasFilters" type="button" class="btn btn--ghost" data-test="users-clear-filters" @click="clearFilters">
                    Limpiar filtros
                </button>
            </div>

            <AlertMessage :message="loadError" />
            <button v-if="loadError" type="button" class="btn btn--secondary" data-test="users-retry" @click="loadUsers">
                Reintentar
            </button>

            <div v-else class="table-wrapper" :class="{ 'is-loading': loading }" :aria-busy="loading">
                <table class="table" data-test="users-table">
                    <thead>
                        <tr>
                            <th scope="col">Nombre</th>
                            <th scope="col">Email</th>
                            <th scope="col">Rol</th>
                            <th scope="col">Alta</th>
                            <th scope="col"><span class="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in result.usuarios" :key="user.uid" data-test="user-row">
                            <td data-label="Nombre">
                                <strong>{{ user.nombre }}</strong>
                                <span v-if="isSelf(user)" class="badge badge--neutral">Tú</span>
                            </td>
                            <td data-label="Email">{{ user.email }}</td>
                            <td data-label="Rol">
                                <span class="badge" :class="user.rol === 'admin' ? 'badge--primary' : 'badge--neutral'">
                                    {{ user.rol === 'admin' ? 'Administrador' : 'Usuario' }}
                                </span>
                            </td>
                            <td data-label="Alta">{{ formatDate(user.createdAt) }}</td>
                            <td class="table__actions">
                                <RouterLink
                                    :to="{ name: 'user-edit', params: { id: user.uid } }"
                                    class="btn btn--secondary btn--sm"
                                    data-test="user-edit"
                                >
                                    Editar
                                </RouterLink>
                                <button
                                    type="button"
                                    class="btn btn--danger-outline btn--sm"
                                    :disabled="isSelf(user)"
                                    :title="isSelf(user) ? 'No puedes eliminar tu propia cuenta' : undefined"
                                    data-test="user-delete"
                                    @click="userToDelete = user"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p v-if="!loading && result.usuarios.length === 0" class="empty-state" data-test="users-empty">
                    {{ hasFilters ? 'Ningún usuario coincide con los filtros.' : 'Todavía no hay usuarios.' }}
                </p>
            </div>

            <PaginationBar
                v-if="!loadError && result.total > 0"
                :page="result.pagina"
                :total-pages="result.totalPaginas"
                :total="result.total"
                :limit="result.limite"
                @change="changePage"
            />
        </div>

        <ConfirmDialog
            :open="Boolean(userToDelete)"
            title="Eliminar usuario"
            :message="userToDelete ? `Se eliminará a ${userToDelete.nombre} (${userToDelete.email}) y ya no podrá iniciar sesión.` : ''"
            confirm-text="Eliminar"
            :loading="deleting"
            @confirm="confirmDelete"
            @cancel="userToDelete = null"
        />
    </section>
</template>
