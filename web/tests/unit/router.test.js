import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  isAuthenticated: { value: false },
  isAdmin: { value: false },
  restoreSession: vi.fn(),
}));

vi.mock("@/composables/useAuth.js", () => ({
  useAuth: () => auth,
}));

async function importarRouter() {
  vi.resetModules();
  const { default: router } = await import("@/router/index.js");
  return router;
}

describe("guardas del router", () => {
  beforeEach(() => {
    auth.isAuthenticated.value = false;
    auth.isAdmin.value = false;
    auth.restoreSession.mockReset();
    auth.restoreSession.mockResolvedValue();
  });

  it("permite entrar a /login sin sesión", async () => {
    const router = await importarRouter();
    await router.push("/login");
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("redirige a /login con redirect cuando una ruta requiere sesión", async () => {
    const router = await importarRouter();
    await router.push("/perfil");

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/perfil");
  });

  it("con sesión, /login redirige a la home y esta al perfil del usuario", async () => {
    auth.isAuthenticated.value = true;
    auth.isAdmin.value = false;
    const router = await importarRouter();

    await router.push("/login");

    expect(router.currentRoute.value.name).toBe("profile");
  });

  it("un usuario normal que abre /usuarios es redirigido a /perfil", async () => {
    auth.isAuthenticated.value = true;
    auth.isAdmin.value = false;
    const router = await importarRouter();

    await router.push("/usuarios");

    expect(router.currentRoute.value.name).toBe("profile");
  });

  it("un admin puede entrar a /usuarios", async () => {
    auth.isAuthenticated.value = true;
    auth.isAdmin.value = true;
    const router = await importarRouter();

    await router.push("/usuarios");

    expect(router.currentRoute.value.name).toBe("users");
  });

  it("la raíz redirige a /usuarios para admin", async () => {
    auth.isAuthenticated.value = true;
    auth.isAdmin.value = true;
    const router = await importarRouter();

    await router.push("/");

    expect(router.currentRoute.value.name).toBe("users");
  });

  it("una ruta inexistente muestra no encontrada", async () => {
    const router = await importarRouter();
    await router.push("/ruta-que-no-existe");
    expect(router.currentRoute.value.name).toBe("not-found");
  });

  it("actualiza el título del documento con el de la ruta", async () => {
    const router = await importarRouter();
    await router.push("/login");
    await router.isReady();
    expect(document.title).toBe("Iniciar sesión · Gestión de usuarios");
  });
});
