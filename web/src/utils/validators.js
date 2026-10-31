// Las mismas reglas que valida la API (api/src/utils/validators.js).
// Validar también en el cliente da respuesta inmediata al usuario;
// la API sigue siendo la que decide.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(name) {
    const value = name.trim()
    if (!value) return 'El nombre es obligatorio'
    if (value.length < 2 || value.length > 60) return 'El nombre debe tener entre 2 y 60 caracteres'
    return ''
}

export function validateEmail(email) {
    const value = email.trim()
    if (!value) return 'El email es obligatorio'
    if (!EMAIL_REGEX.test(value)) return 'El email no tiene un formato válido'
    return ''
}

export function validatePassword(password) {
    if (!password) return 'La contraseña es obligatoria'
    if (password.length < 8 || password.length > 64) return 'La contraseña debe tener entre 8 y 64 caracteres'
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula'
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una minúscula'
    if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número'
    return ''
}

export function validatePasswordConfirmation(password, confirmation) {
    if (!confirmation) return 'Repite la contraseña'
    if (password !== confirmation) return 'Las contraseñas no coinciden'
    return ''
}

/** Devuelve true si el objeto de errores no tiene ningún mensaje. */
export const isValid = (errors) => Object.values(errors).every((message) => !message)
