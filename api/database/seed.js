// ============================================================
// Datos iniciales
//   - crearAdminInicial(): se llama al arrancar app.js
//   - npm run seed: BORRA la colección y carga usuarios de ejemplo
// ============================================================
import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { dbConnection } from "./config.js";
import Usuario from "../models/usuario.js";

const USUARIOS_DEMO = [
  { nombre: "Ana Torres", email: "ana@demo.com", password: "Usuario123", rol: "usuario" },
  { nombre: "Luis Gómez", email: "luis@demo.com", password: "Usuario123", rol: "usuario" },
  { nombre: "Marta Ruiz", email: "marta@demo.com", password: "Usuario123", rol: "admin" },
  { nombre: "Pedro Sánchez", email: "pedro@demo.com", password: "Usuario123", rol: "usuario", estado: false },
];

const datosAdmin = () => ({
  nombre: process.env.ADMIN_NOMBRE ?? "Administrador",
  email: process.env.ADMIN_EMAIL ?? "admin@demo.com",
  password: process.env.ADMIN_PASSWORD ?? "Admin123!",
  rol: "admin",
});

// Si no hay ningún administrador activo, crea el definido en .env
export const crearAdminInicial = async () => {
  const hayAdmin = await Usuario.exists({ rol: "admin", estado: true });
  if (hayAdmin) return null;

  const admin = new Usuario(datosAdmin());
  await admin.save();
  return admin;
};

const seed = async () => {
  await dbConnection();
  await Usuario.deleteMany({});

  // save() uno por uno para que el hook del modelo hashee cada contraseña
  for (const datos of [datosAdmin(), ...USUARIOS_DEMO]) {
    await new Usuario(datos).save();
  }

  console.log(`Colección de usuarios reiniciada con ${USUARIOS_DEMO.length + 1} usuarios`);
  await mongoose.disconnect();
};

// Solo se ejecuta con "node database/seed.js", no al importarlo desde app.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed().catch(async (error) => {
    console.log("No se pudo cargar los datos:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
}
