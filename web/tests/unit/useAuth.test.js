import { beforeEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({
  login: vi.fn(),
  registro: vi.fn(),
  perfil: vi.fn(),
  actualizarPerfil: vi.fn(),
  cambiarPassword: vi.fn(),
}));

vi.mock("@/services/authApi.js", () => ({ authApi }));

async function importarAuth() {
  const { useAuth } = await import("@/composables/useAuth.js");
  return useAuth();
}

const usuario = { uid: "1", nombre: "Ana", email: "ana@demo.com", rol: "usuario" };
const admin = { uid: "2", nombre: "Admin", email: "admin@demo.com", rol: "admin" };

describe("useAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("login guarda token y usuario, y deja la sesión autenticada", async () => {
    authApi.login.mockResolvedValue({ token: "token-1", usuario });
    const auth = await importarAuth();

    await auth.login({ email: "ana@demo.com", password: "Usuario123" });

    expect(authApi.login).toHaveBeenCalledWith({ email: "ana@demo.com", password: "Usuario123" });
    expect(auth.state.token).toBe("token-1");
    expect(auth.state.user).toEqual(usuario);
    expect(localStorage.getItem("x-token")).toBe("token-1");
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isAdmin.value).toBe(false);
  });

  it("registro inicia la sesión con el usuario devuelto", async () => {
    authApi.registro.mockResolvedValue({ token: "token-2", usuario });
    const auth = await importarAuth();

    await auth.register({ nombre: "Ana", email: "ana@demo.com", password: "Usuario123" });

    expect(auth.state.user).toEqual(usuario);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it("detecta al administrador con isAdmin", async () => {
    authApi.login.mockResolvedValue({ token: "token-admin", usuario: admin });
    const auth = await importarAuth();

    await auth.login({ email: "admin@demo.com", password: "Admin123!" });

    expect(auth.isAdmin.value).toBe(true);
  });

  it("logout limpia el estado y el token", async () => {
    authApi.login.mockResolvedValue({ token: "token-1", usuario });
    const auth = await importarAuth();
    await auth.login({ email: "ana@demo.com", password: "Usuario123" });

    auth.logout();

    expect(auth.state.token).toBeNull();
    expect(auth.state.user).toBeNull();
    expect(localStorage.getItem("x-token")).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it("restoreSession sin token solo marca la sesión como cargada", async () => {
    const auth = await importarAuth();

    await auth.restoreSession();

    expect(auth.state.loaded).toBe(true);
    expect(authApi.perfil).not.toHaveBeenCalled();
  });

  it("restoreSession con token recupera el perfil de la API", async () => {
    localStorage.setItem("x-token", "token-guardado");
    authApi.perfil.mockResolvedValue(usuario);
    const auth = await importarAuth();

    await auth.restoreSession();

    expect(authApi.perfil).toHaveBeenCalledOnce();
    expect(auth.state.user).toEqual(usuario);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it("restoreSession con token inválido limpia la sesión", async () => {
    localStorage.setItem("x-token", "token-vencido");
    authApi.perfil.mockRejectedValue(new Error("Token no válido"));
    const auth = await importarAuth();

    await auth.restoreSession();

    expect(auth.state.user).toBeNull();
    expect(auth.state.token).toBeNull();
    expect(localStorage.getItem("x-token")).toBeNull();
    expect(auth.state.loaded).toBe(true);
  });

  it("setUser y clearSession actualizan el estado compartido", async () => {
    authApi.login.mockResolvedValue({ token: "token-1", usuario });
    const auth = await importarAuth();
    await auth.login({ email: "ana@demo.com", password: "Usuario123" });

    auth.setUser({ ...usuario, nombre: "Ana Editada" });
    expect(auth.state.user.nombre).toBe("Ana Editada");

    auth.clearSession();
    expect(auth.state.user).toBeNull();
    expect(auth.state.loaded).toBe(true);
  });
});
