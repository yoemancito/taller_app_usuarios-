// ============================================================
// 🔐 App de usuarios — API con autenticación JWT y CRUD de usuarios
// Estructura MVC:
//   app.js · database/ · models/ · routes/ · controllers/ · middlewares/ · helpers/
// Ejecutar: npm run dev
// Requiere .env con PUERTO, MONGODB_CNX y JWT_SECRET (ver .env.example)
// ============================================================

import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth.js";
import usuariosRouter from "./routes/usuarios.js";

const app = express();

// 1. Logger de peticiones
app.use((req, res, next) => {
  const hora = new Date().toLocaleTimeString();
  console.log(`[${hora}] ${req.method} ${req.url}`);
  next();
});

// 2. Body JSON
app.use(express.json());

// 3. Rutas
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);

// 4. 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 5. Middleware de errores
app.use((err, req, res, next) => {
  // JSON mal formado en el body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }
  // Email duplicado que se coló entre la validación y el guardado (índice unique)
  if (err.code === 11000) {
    return res.status(400).json({ error: "Ese email ya está registrado" });
  }
  // Error del Schema → 400 con el mensaje exacto
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  console.log("ERROR:", err.message);
  res.status(500).json({ error: "Error interno" });
});

// app.js solo crea y exporta la aplicación: no conecta ni abre el puerto.
// Así Supertest puede usarla directamente y server.js se encarga de la BD.
export default app;
