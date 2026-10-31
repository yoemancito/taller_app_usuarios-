// SOLO rutas + validaciones (check) — la lógica vive en controllers/usuarios.js
import { Router } from "express";
import { check } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validarRol } from "../middlewares/validar-rol.js";
import { esRolValido } from "../helpers/db-validators.js";
import { validarEmail, validarNombre, validarPassword } from "../helpers/reglas-usuario.js";
import { listar, obtener, crear, actualizar, eliminar } from "../controllers/usuarios.js";

const router = Router();

// TODO el CRUD es solo para administradores: token + rol admin.
// La cadena corre en orden: validarJWT deja req.usuario, validarRol lo revisa.
router.use(validarJWT, validarRol("admin"));

router.get(
  "/",
  [
    check("pagina").optional().isInt({ min: 1 }).withMessage("La página debe ser un entero mayor que 0"),
    check("limite").optional().isInt({ min: 1, max: 50 }).withMessage("El límite debe estar entre 1 y 50"),
    check("rol").optional({ values: "falsy" }).custom(esRolValido),
    validarCampos,
  ],
  listar
);

router.get("/:id", [check("id", "Id no válido").isMongoId(), validarCampos], obtener);

router.post(
  "/",
  [
    validarNombre(),
    validarEmail(),
    validarPassword(),
    check("rol").optional().custom(esRolValido),
    validarCampos,
  ],
  crear
);

router.put(
  "/:id",
  [
    check("id", "Id no válido").isMongoId(),
    validarNombre().optional(),
    validarEmail("email", (req) => req.params.id).optional(),
    // Contraseña opcional: vacía o ausente = no se cambia
    validarPassword().optional({ values: "falsy" }),
    check("rol").optional().custom(esRolValido),
    validarCampos,
  ],
  actualizar
);

router.delete("/:id", [check("id", "Id no válido").isMongoId(), validarCampos], eliminar);

export default router;
