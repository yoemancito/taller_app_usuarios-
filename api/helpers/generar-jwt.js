import jwt from "jsonwebtoken";

// El uid y el rol viajan dentro del token
export const generarJWT = (usuario) =>
  jwt.sign({ uid: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRA ?? "4h",
  });
