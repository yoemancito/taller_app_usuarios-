const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'x-token'

export class ApiError extends Error {
    /**
     * @param {number} status código HTTP (0 = sin conexión)
     * @param {string} message mensaje general
     * @param {Record<string, string>} details errores por campo { campo: mensaje }
     */
    constructor(status, message, details = {}) {
        super(message)
        this.status = status
        this.details = details
    }
}

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
}

// Quien quiera enterarse de que la sesión dejó de ser válida (401) se registra aquí
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler
}

/**
 * La API responde los errores de dos formas:
 *   { error: "mensaje" }                              → error general
 *   { errores: [{ path: "email", msg: "..." }, ...] } → validación por campo (express-validator)
 */
function toApiError(status, data) {
    if (Array.isArray(data?.errores)) {
        const details = Object.fromEntries(data.errores.map(({ path, msg }) => [path, msg]))
        return new ApiError(status, 'Revisa los datos del formulario', details)
    }
    return new ApiError(status, data?.error ?? `Error ${status}`)
}

/**
 * Envoltorio de fetch: añade el token en el header x-token, convierte el body
 * a JSON y transforma las respuestas de error en ApiError.
 */
export async function request(path, { method = 'GET', body, query } = {}) {
    const url = new URL(`${API_URL}${path}`, window.location.origin)
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
        }
    }

    const headers = { Accept: 'application/json' }
    const token = tokenStorage.get()
    if (token) headers['x-token'] = token
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    let response
    try {
        response = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    } catch {
        throw new ApiError(0, 'No se pudo conectar con el servidor. Comprueba que la API está en marcha.')
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        if (response.status === 401 && token) onUnauthorized()
        throw toApiError(response.status, data)
    }
    return data
}
