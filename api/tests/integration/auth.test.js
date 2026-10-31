import { describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Usuario from "../../models/usuario.js";
import { crearUsuario, tokenDe } from "../helpers.js";

describe("POST /api/auth/registro", () => {
  it("con datos válidos responde 201, token, rol usuario y sin password", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Ana Torres",
      email: "ana@test.com",
      password: "Usuario123",
      rol: "admin", // debe ignorarse: el registro público siempre crea usuarios
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toMatchObject({ nombre: "Ana Torres", email: "ana@test.com", rol: "usuario" });
    expect(res.body.usuario.uid).toEqual(expect.any(String));
    expect(res.body.usuario).not.toHaveProperty("password");
  });

  it("con email ya registrado responde 400 con el error en el campo email", async () => {
    await crearUsuario({ email: "ocupado@test.com" });

    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Otra Persona",
      email: "ocupado@test.com",
      password: "Usuario123",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores).toContainEqual({ path: "email", msg: "Ese email ya está registrado" });
  });

  it("con contraseña de menos de 8 caracteres responde 400", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Ana Torres",
      email: "corta@test.com",
      password: "Ab1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((error) => error.path === "password")).toBe(true);
  });

  it("con contraseña sin mayúscula responde 400", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Ana Torres",
      email: "sinmayuscula@test.com",
      password: "usuariolargo1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores).toContainEqual({
      path: "password",
      msg: "La contraseña debe incluir al menos una mayúscula",
    });
  });

  it("con nombre demasiado corto responde 400", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "A",
      email: "nombre@test.com",
      password: "Usuario123",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("nombre");
  });
});

describe("POST /api/auth/login", () => {
  it("con credenciales correctas responde 200 con token y usuario con uid", async () => {
    const usuario = await crearUsuario({ email: "login@test.com", password: "Usuario123" });

    const res = await request(app).post("/api/auth/login").send({ email: "login@test.com", password: "Usuario123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario.uid).toBe(usuario.id);
    expect(res.body.usuario).not.toHaveProperty("password");
  });

  it("con contraseña incorrecta y con email inexistente devuelve el mismo mensaje", async () => {
    await crearUsuario({ email: "existe@test.com", password: "Usuario123" });

    const passIncorrecta = await request(app)
      .post("/api/auth/login")
      .send({ email: "existe@test.com", password: "Incorrecta123" });
    const noExiste = await request(app)
      .post("/api/auth/login")
      .send({ email: "nadie@test.com", password: "Usuario123" });

    expect(passIncorrecta.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(passIncorrecta.body.error).toBe("Credenciales inválidas");
    expect(noExiste.body.error).toBe("Credenciales inválidas");
  });

  it("con un usuario desactivado responde 401 aunque la contraseña sea correcta", async () => {
    await crearUsuario({ email: "inactivo@test.com", password: "Usuario123", estado: false });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inactivo@test.com", password: "Usuario123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Usuario desactivado");
  });

  it("normaliza el email a minúsculas al iniciar sesión", async () => {
    await crearUsuario({ email: "mayus@test.com", password: "Usuario123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "  MAYUS@TEST.COM ", password: "Usuario123" });

    expect(res.status).toBe(200);
  });

  it("sin email válido responde 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "no-es-email", password: "Usuario123" });
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("email");
  });
});

describe("GET /api/auth/perfil", () => {
  it("sin token responde 401", async () => {
    const res = await request(app).get("/api/auth/perfil");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No hay token en la petición");
  });

  it("con token inválido responde 401", async () => {
    const res = await request(app).get("/api/auth/perfil").set("x-token", "token-invalido");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token no válido o expirado");
  });

  it("con token válido responde 200 con el usuario sin password", async () => {
    const usuario = await crearUsuario({ email: "perfil@test.com" });
    const token = await tokenDe(usuario);

    const res = await request(app).get("/api/auth/perfil").set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body.uid).toBe(usuario.id);
    expect(res.body.email).toBe("perfil@test.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("con un usuario desactivado responde 401", async () => {
    const usuario = await crearUsuario({ estado: false });
    const token = await tokenDe(usuario);

    const res = await request(app).get("/api/auth/perfil").set("x-token", token);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Usuario desactivado");
  });
});

describe("PUT /api/auth/perfil", () => {
  it("actualiza nombre y email del usuario autenticado", async () => {
    const usuario = await crearUsuario({ email: "viejo@test.com" });
    const token = await tokenDe(usuario);

    const res = await request(app)
      .put("/api/auth/perfil")
      .set("x-token", token)
      .send({ nombre: "Nombre Nuevo", email: "nuevo@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Nuevo");
    expect(res.body.email).toBe("nuevo@test.com");
  });

  it("permite conservar el propio email sin marcarlo como duplicado", async () => {
    const usuario = await crearUsuario({ email: "propio@test.com" });
    const token = await tokenDe(usuario);

    const res = await request(app)
      .put("/api/auth/perfil")
      .set("x-token", token)
      .send({ nombre: "Otro Nombre", email: "propio@test.com" });

    expect(res.status).toBe(200);
  });
});

describe("PUT /api/auth/password", () => {
  it("con la contraseña actual incorrecta responde 400", async () => {
    const usuario = await crearUsuario({ password: "Usuario123" });
    const token = await tokenDe(usuario);

    const res = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Incorrecta123", passwordNueva: "Nueva1234" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La contraseña actual no es correcta");
  });

  it("con la nueva contraseña igual a la actual responde 400", async () => {
    const usuario = await crearUsuario({ password: "Usuario123" });
    const token = await tokenDe(usuario);

    const res = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Usuario123", passwordNueva: "Usuario123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La nueva contraseña debe ser distinta de la actual");
  });

  it("con una nueva contraseña inválida responde 400", async () => {
    const usuario = await crearUsuario({ password: "Usuario123" });
    const token = await tokenDe(usuario);

    const res = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Usuario123", passwordNueva: "corta" });

    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("passwordNueva");
  });

  it("al cambiar correctamente el login funciona con la nueva y no con la anterior", async () => {
    const usuario = await crearUsuario({ email: "cambio@test.com", password: "Usuario123" });
    const token = await tokenDe(usuario);

    const cambio = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Usuario123", passwordNueva: "Nueva1234" });
    const loginNuevo = await request(app)
      .post("/api/auth/login")
      .send({ email: "cambio@test.com", password: "Nueva1234" });
    const loginViejo = await request(app)
      .post("/api/auth/login")
      .send({ email: "cambio@test.com", password: "Usuario123" });

    expect(cambio.status).toBe(200);
    expect(loginNuevo.status).toBe(200);
    expect(loginViejo.status).toBe(401);
  });
});

describe("rutas generales de la API", () => {
  it("GET /api/health responde 200 con status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("una ruta inexistente responde 404 en JSON", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Ruta no encontrada" });
  });

  it("un body con JSON mal formado responde 400 con un mensaje claro", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El cuerpo de la petición no es un JSON válido");
  });

  it("el índice unique de Mongo produce 400 si el email duplicado esquiva la validación", async () => {
    // Se fuerza el error de Mongo con un email que ya existe, sin pasar por la ruta.
    const usuario = await crearUsuario({ email: "duplicado@test.com" });
    expect(usuario).toBeDefined();
    expect(mongoose.connection.readyState).toBe(1);
    await expect(
      new Usuario({ nombre: "Duplicado", email: "duplicado@test.com", password: "Usuario123" }).save(),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
