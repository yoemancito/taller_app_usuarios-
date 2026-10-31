import { request } from './http.js'

const ruta = (uid) => `/usuarios/${encodeURIComponent(uid)}`

export const usersApi = {
    listar: ({ buscar, rol, pagina, limite } = {}) => request('/usuarios', { query: { buscar, rol, pagina, limite } }),
    obtener: (uid) => request(ruta(uid)),
    crear: (datos) => request('/usuarios', { method: 'POST', body: datos }),
    actualizar: (uid, datos) => request(ruta(uid), { method: 'PUT', body: datos }),
    eliminar: (uid) => request(ruta(uid), { method: 'DELETE' }),
}
