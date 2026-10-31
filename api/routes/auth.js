// SOLO rutas + validaciones (check) — la lógica vive en controllers/auth.js
import { Router } from "express";
import { check } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validarEmail, validarNombre, validarPassword } from "../helpers/reglas-usuario.js";
import { login, registro, perfil, actualizarPerfil, cambiarPassword } from "../controllers/auth.js";

const router = Router();

// POST /api/auth/login — aquí NO se exige token: es la puerta de entrada
router.post(
  "/login",
  [
    check("email", "Email no válido").trim().isEmail(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  login
);

// POST /api/auth/registro — público
router.post(
  "/registro",
  [validarNombre(), validarEmail(), validarPassword(), validarCampos],
  registro
);

// GET /api/auth/perfil — cualquier usuario con sesión
router.get("/perfil", [validarJWT], perfil);

// PUT /api/auth/perfil — validarJWT va PRIMERO: el validador del email necesita req.usuario
router.put(
  "/perfil",
  [
    validarJWT,
    validarNombre().optional(),
    validarEmail("email", (req) => req.usuario.id).optional(),
    validarCampos,
  ],
  actualizarPerfil
);

// PUT /api/auth/password
router.put(
  "/password",
  [
    validarJWT,
    check("passwordActual", "La contraseña actual es obligatoria").not().isEmpty(),
    validarPassword("passwordNueva"),
    validarCampos,
  ],
  cambiarPassword
);

export default router;
