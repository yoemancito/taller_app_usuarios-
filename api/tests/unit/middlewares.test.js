import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { check } from "express-validator";
import { validarRol } from "../../middlewares/validar-rol.js";
import { validarJWT } from "../../middlewares/validar-jwt.js";
import { validarCampos } from "../../middlewares/validar-campos.js";
import { crearUsuario, tokenDe } from "../helpers.js";

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("validarRol", () => {
  it("responde 500 si validarJWT no dejó req.usuario", () => {
    const res = mockRes();
    const next = vi.fn();

    validarRol("admin")({}, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Se requiere validarJWT primero" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el rol no está permitido", () => {
    const res = mockRes();
    const next = vi.fn();

    validarRol("admin")({ usuario: { rol: "usuario" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "No tiene permisos para esto" });
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next si el rol está permitido", () => {
    const res = mockRes();
    const next = vi.fn();

    validarRol("admin", "usuario")({ usuario: { rol: "admin" } }, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("validarJWT", () => {
  it("sin header x-token responde 401", async () => {
    const req = { header: vi.fn(() => undefined) };
    const res = mockRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No hay token en la petición" });
    expect(next).not.toHaveBeenCalled();
  });

  it("con un token que no verifica responde 401", async () => {
    const req = { header: vi.fn(() => "no-es-un-jwt") };
    const res = mockRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token no válido o expirado" });
  });

  it("con token válido deja el usuario en req y llama a next", async () => {
    const usuario = await crearUsuario({ nombre: "Autenticado" });
    const token = await tokenDe(usuario);
    const req = { header: vi.fn(() => token) };
    const res = mockRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.usuario.id).toBe(usuario.id);
    expect(req.usuario.nombre).toBe("Autenticado");
  });
});

describe("validarCampos", () => {
  function appDePrueba() {
    const app = express();
    app.use(express.json());
    app.post("/", [check("email", "Email no válido").isEmail(), validarCampos], (req, res) => {
      res.json({ ok: true });
    });
    return app;
  }

  it("deja pasar la petición cuando no hay errores", async () => {
    const res = await request(appDePrueba()).post("/").send({ email: "ok@test.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("responde 400 con path y msg, sin devolver el valor enviado", async () => {
    const res = await request(appDePrueba()).post("/").send({ email: "no-es-email" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errores: [{ path: "email", msg: "Email no válido" }] });
    expect(JSON.stringify(res.body)).not.toContain("no-es-email");
  });
});
