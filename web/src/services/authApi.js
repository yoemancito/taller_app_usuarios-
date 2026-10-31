import { request } from './http.js'

export const authApi = {
    login: (credenciales) => request('/auth/login', { method: 'POST', body: credenciales }),
    registro: (datos) => request('/auth/registro', { method: 'POST', body: datos }),
    perfil: () => request('/auth/perfil'),
    actualizarPerfil: (datos) => request('/auth/perfil', { method: 'PUT', body: datos }),
    cambiarPassword: (datos) => request('/auth/password', { method: 'PUT', body: datos }),
}
