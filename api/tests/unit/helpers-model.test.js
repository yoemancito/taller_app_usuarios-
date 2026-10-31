import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import Usuario from "../../models/usuario.js";
import { generarJWT } from "../../helpers/generar-jwt.js";
import { emailExiste, esRolValido } from "../../helpers/db-validators.js";
import { crearUsuario } from "../helpers.js";

describe("generarJWT", () => {
  it("firma un token que contiene uid y rol", async () => {
    const usuario = await crearUsuario({ rol: "admin" });
    const token = generarJWT(usuario);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.uid).toBe(usuario.id);
    expect(payload.rol).toBe("admin");
  });

  it("incluye una expiración", () => {
    const token = generarJWT({ id: "64b000000000000000000001", rol: "usuario" });
    const payload = jwt.decode(token);
    expect(payload.exp).toEqual(expect.any(Number));
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });
});

describe("esRolValido", () => {
  it("devuelve true para admin y usuario", () => {
    expect(esRolValido("admin")).toBe(true);
    expect(esRolValido("usuario")).toBe(true);
  });

  it("lanza un error para un rol desconocido", () => {
    expect(() => esRolValido("superadmin")).toThrow("El rol debe ser uno de: admin, usuario");
  });
});

describe("emailExiste", () => {
  it("lanza error si el email ya pertenece a otro usuario", async () => {
    await crearUsuario({ email: "ocupado@test.com" });
    await expect(emailExiste("ocupado@test.com")).rejects.toThrow("Ese email ya está registrado");
  });

  it("no lanza error si el email pertenece al mismo usuario que se edita", async () => {
    const usuario = await crearUsuario({ email: "propio@test.com" });
    await expect(emailExiste("propio@test.com", usuario.id)).resolves.toBeUndefined();
  });

  it("no lanza error si el email no está registrado", async () => {
    await expect(emailExiste("libre@test.com")).resolves.toBeUndefined();
  });
});

describe("modelo Usuario", () => {
  it("hashea la contraseña en pre(save) y validarPassword la compara", async () => {
    const usuario = await crearUsuario({ password: "Usuario123" });

    expect(usuario.password).not.toBe("Usuario123");
    expect(usuario.validarPassword("Usuario123")).toBe(true);
    expect(usuario.validarPassword("Otra1234")).toBe(false);
  });

  it("toJSON no devuelve password, _id ni __v y expone uid", async () => {
    const usuario = await crearUsuario({ email: "json@test.com" });
    const json = usuario.toJSON();

    expect(String(json.uid)).toBe(usuario.id);
    expect(json.email).toBe("json@test.com");
    expect(json).not.toHaveProperty("password");
    expect(json).not.toHaveProperty("_id");
    expect(json).not.toHaveProperty("__v");
  });

  it("aplica rol usuario por defecto y estado activo", async () => {
    const usuario = await crearUsuario({ rol: undefined, estado: undefined });
    expect(usuario.rol).toBe("usuario");
    expect(usuario.estado).toBe(true);
  });

  it("rechaza un rol fuera del enum", async () => {
    await expect(crearUsuario({ rol: "root" })).rejects.toThrow(/enum/);
  });

  it("no re-hashea la contraseña si no cambió", async () => {
    const usuario = await crearUsuario({ password: "Usuario123" });
    const hashInicial = usuario.password;

    usuario.nombre = "Nombre Actualizado";
    await usuario.save();

    expect(usuario.password).toBe(hashInicial);
    expect(usuario.validarPassword("Usuario123")).toBe(true);
  });
});
