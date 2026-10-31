import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request, setUnauthorizedHandler, tokenStorage } from "@/services/http.js";

function respuesta(data, { ok = true, status = 200 } = {}) {
  return { ok, status, json: vi.fn().mockResolvedValue(data) };
}

describe("tokenStorage", () => {
  it("guarda, lee y elimina el token en localStorage", () => {
    expect(tokenStorage.get()).toBeNull();
    tokenStorage.set("abc123");
    expect(tokenStorage.get()).toBe("abc123");
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe("request", () => {
  beforeEach(() => {
    tokenStorage.clear();
    setUnauthorizedHandler(() => {});
  });

  it("envía el header x-token cuando hay token guardado", async () => {
    tokenStorage.set("token-guardado");
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await request("/auth/perfil");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe("http://localhost:3000/api/auth/perfil");
    expect(options.headers["x-token"]).toBe("token-guardado");
    expect(options.body).toBeUndefined();
  });

  it("no envía x-token si no hay token guardado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await request("/auth/login", { method: "POST", body: { email: "ana@demo.com" } });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).not.toHaveProperty("x-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ email: "ana@demo.com" }));
  });

  it("agrega solo los parámetros de query con valor", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ usuarios: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await request("/usuarios", { query: { buscar: "ana", rol: "", pagina: 2, limite: undefined } });

    const [url] = fetchMock.mock.calls[0];
    expect(url.searchParams.get("buscar")).toBe("ana");
    expect(url.searchParams.get("pagina")).toBe("2");
    expect(url.searchParams.has("rol")).toBe(false);
    expect(url.searchParams.has("limite")).toBe(false);
  });

  it("convierte los errores por campo en ApiError con details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respuesta(
          { errores: [{ path: "email", msg: "Ese email ya está registrado" }, { path: "password", msg: "Muy corta" }] },
          { ok: false, status: 400 },
        ),
      ),
    );

    await expect(request("/auth/registro", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "Error",
      status: 400,
      message: "Revisa los datos del formulario",
      details: { email: "Ese email ya está registrado", password: "Muy corta" },
    });
  });

  it("convierte { error } en ApiError con ese mensaje", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respuesta({ error: "Credenciales inválidas" }, { ok: false, status: 401 })),
    );

    const error = await request("/auth/login", { method: "POST", body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Credenciales inválidas");
    expect(error.details).toEqual({});
  });

  it("si fetch falla lanza ApiError con status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(request("/auth/perfil")).rejects.toMatchObject({
      status: 0,
      message: "No se pudo conectar con el servidor. Comprueba que la API está en marcha.",
    });
  });

  it("con 401 y token guardado llama al manejador de sesión expirada", async () => {
    tokenStorage.set("token-viejo");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta({ error: "Token no válido" }, { ok: false, status: 401 })));

    await request("/auth/perfil").catch(() => {});

    expect(handler).toHaveBeenCalledOnce();
  });

  it("con 401 sin token no llama al manejador de sesión expirada", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta({ error: "Credenciales inválidas" }, { ok: false, status: 401 })));

    await request("/auth/login", { method: "POST", body: {} }).catch(() => {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("devuelve el JSON de una respuesta correcta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta({ token: "abc", usuario: { uid: "1" } })));
    await expect(request("/auth/login", { method: "POST", body: {} })).resolves.toEqual({
      token: "abc",
      usuario: { uid: "1" },
    });
  });

  it("si la respuesta no trae JSON devuelve null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn().mockRejectedValue(new Error("sin body")) }),
    );
    await expect(request("/usuarios/1", { method: "DELETE" })).resolves.toBeNull();
  });
});
