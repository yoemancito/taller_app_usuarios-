// Middleware de autenticación: sin token válido, no se pasa de aquí
import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";

export const validarJWT = async (req, res, next) => {
  // El token viaja en el header x-token
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ error: "No hay token en la petición" });
  }

  try {
    // verify lanza excepción si el token es inválido o expiró
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);

    // Dejar el usuario disponible para los controladores
    const usuario = await Usuario.findById(uid);

    // Usuario borrado lógicamente o desactivado
    if (!usuario || usuario.estado === false) {
      return res.status(401).json({ error: "Usuario desactivado" });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token no válido o expirado" });
  }
};
