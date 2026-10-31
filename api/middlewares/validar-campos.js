// Middleware que revisa el resultado de los check() declarados en la ruta.
// Si hay errores, responde 400 con la lista; si no, continúa al controlador.
import { validationResult } from "express-validator";

export const validarCampos = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // onlyFirstError: un solo mensaje por campo.
    // Solo campo (path) y mensaje: no se devuelve el valor enviado (podría ser una contraseña)
    const lista = errores.array({ onlyFirstError: true }).map(({ path, msg }) => ({ path, msg }));
    return res.status(400).json({ errores: lista });
  }

  next();
};
