import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/services/http.js", () => ({ request: mocks.request }));

import { authApi } from "@/services/authApi.js";
import { usersApi } from "@/services/usersApi.js";

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
  });

  it("login envía POST a /auth/login con las credenciales", async () => {
    await authApi.login({ email: "ana@demo.com", password: "Usuario123" });
    expect(mocks.request).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "ana@demo.com", password: "Usuario123" },
    });
  });

  it("registro envía POST a /auth/registro", async () => {
    await authApi.registro({ nombre: "Ana" });
    expect(mocks.request).toHaveBeenCalledWith("/auth/registro", { method: "POST", body: { nombre: "Ana" } });
  });

  it("perfil hace GET y actualizarPerfil/cambiarPassword hacen PUT", async () => {
    await authApi.perfil();
    await authApi.actualizarPerfil({ nombre: "Nuevo" });
    await authApi.cambiarPassword({ passwordActual: "a", passwordNueva: "b" });

    expect(mocks.request).toHaveBeenNthCalledWith(1, "/auth/perfil");
    expect(mocks.request).toHaveBeenNthCalledWith(2, "/auth/perfil", { method: "PUT", body: { nombre: "Nuevo" } });
    expect(mocks.request).toHaveBeenNthCalledWith(3, "/auth/password", {
      method: "PUT",
      body: { passwordActual: "a", passwordNueva: "b" },
    });
  });
});

describe("usersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
  });

  it("listar envía los filtros como query", async () => {
    await usersApi.listar({ buscar: "ana", rol: "usuario", pagina: 2, limite: 8 });
    expect(mocks.request).toHaveBeenCalledWith("/usuarios", {
      query: { buscar: "ana", rol: "usuario", pagina: 2, limite: 8 },
    });
  });

  it("obtener codifica el uid en la ruta", async () => {
    await usersApi.obtener("abc/123");
    expect(mocks.request).toHaveBeenCalledWith("/usuarios/abc%2F123");
  });

  it("crear y actualizar envían POST/PUT con el body", async () => {
    await usersApi.crear({ nombre: "Nuevo" });
    await usersApi.actualizar("uid-1", { nombre: "Editado" });

    expect(mocks.request).toHaveBeenNthCalledWith(1, "/usuarios", { method: "POST", body: { nombre: "Nuevo" } });
    expect(mocks.request).toHaveBeenNthCalledWith(2, "/usuarios/uid-1", {
      method: "PUT",
      body: { nombre: "Editado" },
    });
  });

  it("eliminar hace DELETE sobre el usuario", async () => {
    await usersApi.eliminar("uid-1");
    expect(mocks.request).toHaveBeenCalledWith("/usuarios/uid-1", { method: "DELETE" });
  });
});
