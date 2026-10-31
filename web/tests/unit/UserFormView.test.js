import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import UserFormView from "@/views/UserFormView.vue";

const mocks = vi.hoisted(() => ({
  state: { user: { uid: "admin-1", nombre: "Admin", rol: "admin" } },
  setUser: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  obtener: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
}));

vi.mock("@/composables/useAuth.js", () => ({
  useAuth: () => ({ state: mocks.state, setUser: mocks.setUser }),
}));
vi.mock("@/composables/useToast.js", () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));
vi.mock("@/services/usersApi.js", () => ({
  usersApi: { obtener: mocks.obtener, crear: mocks.crear, actualizar: mocks.actualizar },
}));

const usuarioEditado = {
  uid: "user-2",
  nombre: "Ana Torres",
  email: "ana@demo.com",
  rol: "usuario",
};

async function montar(path = "/usuarios/nuevo", id = "") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/usuarios", name: "users", component: { template: "<div>lista</div>" } },
      { path: "/usuarios/nuevo", name: "user-create", component: UserFormView },
      { path: "/usuarios/:id/editar", name: "user-edit", component: UserFormView, props: true },
    ],
  });
  await router.push(path);
  await router.isReady();

  const wrapper = mount(UserFormView, {
    props: id ? { id } : {},
    global: { plugins: [router] },
  });
  await flushPromises();
  return { wrapper, router };
}

describe("UserFormView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.crear.mockResolvedValue({});
    mocks.actualizar.mockResolvedValue({ ...usuarioEditado, nombre: "Ana Editada" });
    mocks.obtener.mockResolvedValue(usuarioEditado);
  });

  it("en modo crear muestra el título y valida los campos antes de llamar a la API", async () => {
    const { wrapper } = await montar();

    expect(wrapper.text()).toContain("Nuevo usuario");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.crear).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="user-name-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="user-email-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="user-password-error"]').exists()).toBe(true);
  });

  it("crea un usuario con los datos y vuelve al listado", async () => {
    const { wrapper, router } = await montar();

    await wrapper.get('[data-test="user-name"]').setValue("Nuevo Usuario");
    await wrapper.get('[data-test="user-email"]').setValue("nuevo@demo.com");
    await wrapper.get('[data-test="user-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="user-role"]').setValue("admin");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.crear).toHaveBeenCalledWith({
      nombre: "Nuevo Usuario",
      email: "nuevo@demo.com",
      rol: "admin",
      password: "Usuario123",
    });
    expect(mocks.success).toHaveBeenCalledWith("Usuario creado");
    expect(router.currentRoute.value.name).toBe("users");
  });

  it("en modo editar carga el usuario y no exige contraseña", async () => {
    const { wrapper } = await montar("/usuarios/user-2/editar", "user-2");

    expect(mocks.obtener).toHaveBeenCalledWith("user-2");
    expect(wrapper.get('[data-test="user-name"]').element.value).toBe("Ana Torres");
    expect(wrapper.get('[data-test="user-email"]').element.value).toBe("ana@demo.com");

    await wrapper.get('[data-test="user-name"]').setValue("Ana Editada");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.actualizar).toHaveBeenCalledWith("user-2", {
      nombre: "Ana Editada",
      email: "ana@demo.com",
      rol: "usuario",
    });
  });

  it("al editar la propia cuenta deshabilita el rol y muestra la pista", async () => {
    mocks.obtener.mockResolvedValue({ ...usuarioEditado, uid: "admin-1", rol: "admin", nombre: "Admin" });
    const { wrapper } = await montar("/usuarios/admin-1/editar", "admin-1");

    expect(wrapper.get('[data-test="user-role"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="self-edit-hint"]').text()).toBe("No puedes cambiar tu propio rol.");
  });

  it("si el usuario no existe muestra el estado no encontrado", async () => {
    mocks.obtener.mockRejectedValue({ status: 404, message: "Usuario no encontrado", details: {} });
    const { wrapper } = await montar("/usuarios/no-existe/editar", "no-existe");

    expect(wrapper.get('[data-test="user-not-found"]').text()).toContain("El usuario no existe o fue eliminado.");
    expect(wrapper.find('[data-test="user-form"]').exists()).toBe(false);
  });

  it("muestra el error de la API junto al campo email", async () => {
    mocks.crear.mockRejectedValue({
      message: "Revisa los datos del formulario",
      details: { email: "Ese email ya está registrado" },
    });
    const { wrapper } = await montar();

    await wrapper.get('[data-test="user-name"]').setValue("Nuevo Usuario");
    await wrapper.get('[data-test="user-email"]').setValue("repetido@demo.com");
    await wrapper.get('[data-test="user-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="user-email-error"]').text()).toBe("Ese email ya está registrado");
  });

  it("muestra como alert el error general de la API", async () => {
    mocks.crear.mockRejectedValue({ message: "Error interno", details: {} });
    const { wrapper } = await montar();

    await wrapper.get('[data-test="user-name"]').setValue("Nuevo Usuario");
    await wrapper.get('[data-test="user-email"]').setValue("nuevo@demo.com");
    await wrapper.get('[data-test="user-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="alert"]').text()).toBe("Error interno");
  });

  it("al editarse a sí mismo actualiza la sesión", async () => {
    mocks.obtener.mockResolvedValue({ ...usuarioEditado, uid: "admin-1", rol: "admin", nombre: "Admin" });
    const actualizado = { ...usuarioEditado, uid: "admin-1", rol: "admin", nombre: "Admin Editado" };
    mocks.actualizar.mockResolvedValue(actualizado);
    const { wrapper } = await montar("/usuarios/admin-1/editar", "admin-1");

    await wrapper.get('[data-test="user-name"]').setValue("Admin Editado");
    await wrapper.get('[data-test="user-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.setUser).toHaveBeenCalledWith(actualizado);
  });
});
