// Autorización: autenticado (validarJWT) pero sin permiso suficiente
export const validarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // validarJWT debe correr ANTES: si no, req.usuario no existe
    if (!req.usuario) {
      return res.status(500).json({ error: "Se requiere validarJWT primero" });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      // 403: autenticado, pero prohibido
      return res.status(403).json({ error: "No tiene permisos para esto" });
    }

    next();
  };
};
