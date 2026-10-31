import Usuario from "../models/usuario.js";
import { generarJWT } from "../helpers/generar-jwt.js";

let secuencia = 0;

/** Crea un usuario real en la base de datos de prueba y lo devuelve. */
export async function crearUsuario(overrides = {}) {
  const datos = {
    nombre: "Usuario Prueba",
    email: `usuario${++secuencia}@test.com`,
    password: "Usuario123",
    rol: "usuario",
    ...overrides,
  };

  return new Usuario(datos).save();
}

export async function tokenAdmin(overrides = {}) {
  const usuario = await crearUsuario({ nombre: "Admin Prueba", rol: "admin", ...overrides });
  return generarJWT(usuario);
}

export async function tokenUsuario(overrides = {}) {
  const usuario = await crearUsuario(overrides);
  return generarJWT(usuario);
}

export async function tokenDe(usuario) {
  return generarJWT(usuario);
}
