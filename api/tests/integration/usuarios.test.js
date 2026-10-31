import { describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Usuario from "../../models/usuario.js";
import { crearUsuario, tokenAdmin, tokenDe, tokenUsuario } from "../helpers.js";

const idInexistente = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/usuarios", () => {
  it("sin token responde 401", async () => {
    const res = await request(app).get("/api/usuarios");
    expect(res.status).toBe(401);
  });

  it("con token de rol usuario responde 403", async () => {
    const token = await tokenUsuario();
    const res = await request(app).get("/api/usuarios").set("x-token", token);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("No tiene permisos para esto");
  });

  it("como admin devuelve total, pagina, limite, totalPaginas y solo activos", async () => {
    const admin = await crearUsuario({ nombre: "Admin", rol: "admin" });
    const activo = await crearUsuario({ nombre: "Activo" });
    await crearUsuario({ nombre: "Borrado", estado: false });
    const token = await tokenDe(admin);

    const res = await request(app).get("/api/usuarios").set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, pagina: 1, limite: 10, totalPaginas: 1 });
    expect(res.body.usuarios.map((usuario) => usuario.uid)).toEqual(expect.arrayContaining([admin.id, activo.id]));
    expect(res.body.usuarios.some((usuario) => usuario.estado === false)).toBe(false);
    expect(res.body.usuarios[0]).not.toHaveProperty("password");
  });

  it("con limite=51 responde 400 por estar fuera de rango", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get("/api/usuarios?limite=51").set("x-token", token);
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("limite");
  });

  it("con pagina=0 responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get("/api/usuarios?pagina=0").set("x-token", token);
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("pagina");
  });

  it("con rol inválido responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get("/api/usuarios?rol=superadmin").set("x-token", token);
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("rol");
  });

  it("combina búsqueda por nombre/email con el filtro de rol", async () => {
    const admin = await crearUsuario({ nombre: "Admin", rol: "admin" });
    await crearUsuario({ nombre: "Ana Torres", email: "ana@test.com", rol: "usuario" });
    await crearUsuario({ nombre: "Ana Admin", email: "ana-admin@test.com", rol: "admin" });
    await crearUsuario({ nombre: "Luis", email: "luis@test.com", rol: "usuario" });
    const token = await tokenDe(admin);

    const soloAna = await request(app).get("/api/usuarios?buscar=ana").set("x-token", token);
    const anaUsuario = await request(app).get("/api/usuarios?buscar=ana&rol=usuario").set("x-token", token);
    const porEmail = await request(app).get("/api/usuarios?buscar=luis@test").set("x-token", token);

    expect(soloAna.body.total).toBe(2);
    expect(anaUsuario.body.total).toBe(1);
    expect(anaUsuario.body.usuarios[0].nombre).toBe("Ana Torres");
    expect(porEmail.body.usuarios[0].email).toBe("luis@test.com");
  });

  it("respeta la paginación y calcula totalPaginas", async () => {
    const admin = await crearUsuario({ nombre: "Admin", rol: "admin" });
    for (let i = 1; i <= 4; i++) await crearUsuario({ nombre: `Persona ${i}` });
    const token = await tokenDe(admin);

    const res = await request(app).get("/api/usuarios?pagina=2&limite=2").set("x-token", token);

    expect(res.body).toMatchObject({ total: 5, pagina: 2, limite: 2, totalPaginas: 3 });
    expect(res.body.usuarios).toHaveLength(2);
  });

  it("devuelve una lista vacía sin error cuando no hay coincidencias", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get("/api/usuarios?buscar=no-existe-xyz").set("x-token", token);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.usuarios).toEqual([]);
  });
});

describe("GET /api/usuarios/:id", () => {
  it("con id mal formado responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get("/api/usuarios/abc").set("x-token", token);
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("id");
  });

  it("con id válido inexistente responde 404", async () => {
    const token = await tokenAdmin();
    const res = await request(app).get(`/api/usuarios/${idInexistente()}`).set("x-token", token);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  it("con un usuario eliminado lógicamente responde 404", async () => {
    const token = await tokenAdmin();
    const borrado = await crearUsuario({ estado: false });
    const res = await request(app).get(`/api/usuarios/${borrado.id}`).set("x-token", token);
    expect(res.status).toBe(404);
  });

  it("con id válido devuelve el usuario sin password", async () => {
    const token = await tokenAdmin();
    const usuario = await crearUsuario({ nombre: "Buscado" });
    const res = await request(app).get(`/api/usuarios/${usuario.id}`).set("x-token", token);
    expect(res.status).toBe(200);
    expect(res.body.uid).toBe(usuario.id);
    expect(res.body).not.toHaveProperty("password");
  });
});

describe("POST /api/usuarios", () => {
  it("como admin crea el usuario y guarda la contraseña hasheada", async () => {
    const token = await tokenAdmin();

    const res = await request(app).post("/api/usuarios").set("x-token", token).send({
      nombre: "Creado Por Admin",
      email: "creado@test.com",
      password: "Usuario123",
      rol: "usuario",
    });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("password");
    const guardado = await Usuario.findOne({ email: "creado@test.com" });
    expect(guardado.password).not.toBe("Usuario123");
    expect(guardado.validarPassword("Usuario123")).toBe(true);
  });

  it("con rol inválido responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).post("/api/usuarios").set("x-token", token).send({
      nombre: "Rol Malo",
      email: "rolmalo@test.com",
      password: "Usuario123",
      rol: "superadmin",
    });
    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("rol");
  });

  it("con email duplicado responde 400", async () => {
    const token = await tokenAdmin();
    await crearUsuario({ email: "repetido@test.com" });
    const res = await request(app).post("/api/usuarios").set("x-token", token).send({
      nombre: "Repetido",
      email: "repetido@test.com",
      password: "Usuario123",
    });
    expect(res.status).toBe(400);
    expect(res.body.errores).toContainEqual({ path: "email", msg: "Ese email ya está registrado" });
  });

  it("con token de usuario normal responde 403", async () => {
    const token = await tokenUsuario();
    const res = await request(app).post("/api/usuarios").set("x-token", token).send({
      nombre: "No Permitido",
      email: "nopermitido@test.com",
      password: "Usuario123",
    });
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/usuarios/:id", () => {
  it("el admin no puede cambiar su propio rol", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);

    const res = await request(app)
      .put(`/api/usuarios/${admin.id}`)
      .set("x-token", token)
      .send({ rol: "usuario" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No puedes cambiar tu propio rol");
  });

  it("con password vacía no cambia la contraseña y el login sigue funcionando", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);
    const usuario = await crearUsuario({ email: "sincambio@test.com", password: "Usuario123" });

    const res = await request(app)
      .put(`/api/usuarios/${usuario.id}`)
      .set("x-token", token)
      .send({ nombre: "Nombre Editado", password: "" });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "sincambio@test.com", password: "Usuario123" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Editado");
    expect(login.status).toBe(200);
  });

  it("actualiza la contraseña cuando se envía una nueva válida", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);
    const usuario = await crearUsuario({ email: "nuevaclave@test.com", password: "Usuario123" });

    const res = await request(app)
      .put(`/api/usuarios/${usuario.id}`)
      .set("x-token", token)
      .send({ password: "OtraClave123" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "nuevaclave@test.com", password: "OtraClave123" });

    expect(res.status).toBe(200);
    expect(login.status).toBe(200);
  });

  it("con id inexistente responde 404", async () => {
    const token = await tokenAdmin();
    const res = await request(app)
      .put(`/api/usuarios/${idInexistente()}`)
      .set("x-token", token)
      .send({ nombre: "Nadie" });
    expect(res.status).toBe(404);
  });

  it("con id mal formado responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).put("/api/usuarios/abc").set("x-token", token).send({ nombre: "Nadie" });
    expect(res.status).toBe(400);
  });

  it("con email de otro usuario responde 400", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);
    const uno = await crearUsuario({ email: "uno@test.com" });
    await crearUsuario({ email: "dos@test.com" });

    const res = await request(app)
      .put(`/api/usuarios/${uno.id}`)
      .set("x-token", token)
      .send({ email: "dos@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.errores[0].path).toBe("email");
  });
});

describe("DELETE /api/usuarios/:id", () => {
  it("el admin no puede eliminarse a sí mismo", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);

    const res = await request(app).delete(`/api/usuarios/${admin.id}`).set("x-token", token);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No puedes eliminar tu propia cuenta");
  });

  it("hace borrado lógico: desaparece del listado y ya no puede iniciar sesión", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    const token = await tokenDe(admin);
    const usuario = await crearUsuario({ email: "borrame@test.com", password: "Usuario123" });

    const borrado = await request(app).delete(`/api/usuarios/${usuario.id}`).set("x-token", token);
    const listado = await request(app).get("/api/usuarios").set("x-token", token);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "borrame@test.com", password: "Usuario123" });

    expect(borrado.status).toBe(200);
    expect(borrado.body.mensaje).toBe("Usuario eliminado");
    expect(listado.body.usuarios.some((item) => item.uid === usuario.id)).toBe(false);
    expect(login.status).toBe(401);

    const enBase = await Usuario.findById(usuario.id);
    expect(enBase.estado).toBe(false);
  });

  it("con id inexistente responde 404", async () => {
    const token = await tokenAdmin();
    const res = await request(app).delete(`/api/usuarios/${idInexistente()}`).set("x-token", token);
    expect(res.status).toBe(404);
  });

  it("con id mal formado responde 400", async () => {
    const token = await tokenAdmin();
    const res = await request(app).delete("/api/usuarios/abc").set("x-token", token);
    expect(res.status).toBe(400);
  });

  it("con token de usuario normal responde 403", async () => {
    const token = await tokenUsuario();
    const res = await request(app).delete(`/api/usuarios/${idInexistente()}`).set("x-token", token);
    expect(res.status).toBe(403);
  });
});
