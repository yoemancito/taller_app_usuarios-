// Reglas de validación de campos reutilizadas por routes/auth.js y routes/usuarios.js.
// Cada función devuelve una cadena de express-validator lista para usar.
import { check } from "express-validator";
import { emailExiste } from "./db-validators.js";

export const validarNombre = (campo = "nombre") =>
  check(campo)
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage("El nombre debe tener entre 2 y 60 caracteres");

// obtenerIdPropio(req): al actualizar, devuelve el id del usuario editado
// para que su propio email no cuente como duplicado. Al crear, no se pasa.
export const validarEmail = (campo = "email", obtenerIdPropio = () => undefined) =>
  check(campo)
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .bail()
    .isEmail()
    .withMessage("El email no tiene un formato válido")
    .bail()
    .custom((email, { req }) => emailExiste(email, obtenerIdPropio(req)));

export const validarPassword = (campo = "password") =>
  check(campo)
    .isLength({ min: 8, max: 64 })
    .withMessage("La contraseña debe tener entre 8 y 64 caracteres")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe incluir al menos una mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe incluir al menos una minúscula")
    .matches(/\d/)
    .withMessage("La contraseña debe incluir al menos un número");
