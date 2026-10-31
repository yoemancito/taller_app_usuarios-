import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import UsersView from "@/views/UsersView.vue";

const mocks = vi.hoisted(() => ({
  state: { user: { uid: "admin-1", nombre: "Admin", rol: "admin" } },
  listar: vi.fn(),
  eliminar: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/composables/useAuth.js", () => ({ useAuth: () => ({ state: mocks.state }) }));
vi.mock("@/composables/useToast.js", () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));
vi.mock("@/services/usersApi.js", () => ({
  usersApi: { listar: mocks.listar, eliminar: mocks.eliminar },
}));

const usuarios = [
  {
    uid: "admin-1",
    nombre: "Admin",
    email: "admin@demo.com",
    rol: "admin",
    estado: true,
    createdAt: "2025-01-15T12:00:00.000Z",
  },
  {
    uid: "user-2",
    nombre: "Ana Torres",
    email: "ana@demo.com",
    rol: "usuario",
    estado: true,
    createdAt: "2025-02-10T12:00:00.000Z",
  },
];

async function montar(initial = "/usuarios") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/usuarios", name: "users", component: UsersView },
      { path: "/usuarios/nuevo", name: "user-create", component: { template: "<div />" } },
      { path: "/usuarios/:id/editar", name: "user-edit", component: { template: "<div />" } },
    ],
  });
  await router.push(initial);
  await router.isReady();
  const wrapper = mount(UsersView, {
    global: { plugins: [router], stubs: { Teleport: true } },
    attachTo: document.body,
  });
  await flushPromises();
  return { wrapper, router };
}

function respuesta(overrides = {}) {
  return { usuarios, total: 2, pagina: 1, limite: 8, totalPaginas: 1, ...overrides };
}

describe("UsersView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listar.mockResolvedValue(respuesta());
    mocks.eliminar.mockResolvedValue({ mensaje: "Usuario eliminado" });
  });

  it("carga y muestra los usuarios activos y el total", async () => {
    const { wrapper } = await montar();

    expect(mocks.listar).toHaveBeenCalledWith({ buscar: undefined, rol: undefined, pagina: 1, limite: 8 });
    expect(wrapper.get('[data-test="users-total"]').text()).toBe("2 usuarios activos");
    expect(wrapper.findAll('[data-test="user-row"]')).toHaveLength(2);
    expect(wrapper.text()).toContain("Ana Torres");
    expect(wrapper.text()).toContain("ana@demo.com");
  });

  it("marca la fila propia como Tú y deshabilita su eliminación", async () => {
    const { wrapper } = await montar();
    const filas = wrapper.findAll('[data-test="user-row"]');

    expect(filas[0].text()).toContain("Tú");
    expect(filas[0].get('[data-test="user-delete"]').attributes("disabled")).toBeDefined();
    expect(filas[1].get('[data-test="user-delete"]').attributes("disabled")).toBeUndefined();
  });

  it("muestra el estado vacío cuando no hay usuarios", async () => {
    mocks.listar.mockResolvedValue(respuesta({ usuarios: [], total: 0, totalPaginas: 1 }));
    const { wrapper } = await montar();

    expect(wrapper.get('[data-test="users-empty"]').text()).toBe("Todavía no hay usuarios.");
    expect(wrapper.find('[data-test="pagination-info"]').exists()).toBe(false);
  });

  it("muestra el error de carga y permite reintentar", async () => {
    mocks.listar.mockRejectedValueOnce({ message: "No se pudo conectar" });
    const { wrapper } = await montar();

    expect(wrapper.get('[data-test="alert"]').text()).toBe("No se pudo conectar");

    await wrapper.get('[data-test="users-retry"]').trigger("click");
    await flushPromises();

    expect(mocks.listar).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-test="users-table"]').exists()).toBe(true);
  });

  it("el filtro por rol se guarda en la URL y recarga el listado", async () => {
    const { wrapper, router } = await montar();

    await wrapper.get('[data-test="users-role-filter"]').setValue("usuario");
    await flushPromises();

    expect(router.currentRoute.value.query.rol).toBe("usuario");
    expect(mocks.listar).toHaveBeenLastCalledWith({
      buscar: undefined,
      rol: "usuario",
      pagina: 1,
      limite: 8,
    });
  });

  it("el buscador espera 300 ms, actualiza la URL y busca", async () => {
    const { wrapper, router } = await montar();
    vi.useFakeTimers();

    await wrapper.get('[data-test="users-search"]').setValue("  ana  ");
    vi.advanceTimersByTime(299);
    expect(mocks.listar).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await flushPromises();

    expect(router.currentRoute.value.query.buscar).toBe("ana");
    expect(mocks.listar).toHaveBeenLastCalledWith({
      buscar: "ana",
      rol: undefined,
      pagina: 1,
      limite: 8,
    });
  });

  it("al cambiar de página actualiza la query y recarga", async () => {
    mocks.listar.mockResolvedValue(respuesta({ total: 18, totalPaginas: 3 }));
    const { wrapper, router } = await montar();

    await wrapper.get('[data-test="pagination-next"]').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query.pagina).toBe("2");
    expect(mocks.listar).toHaveBeenLastCalledWith({
      buscar: undefined,
      rol: undefined,
      pagina: 2,
      limite: 8,
    });
  });

  it("elimina un usuario tras confirmar el diálogo y recarga la lista", async () => {
    const { wrapper } = await montar();

    await wrapper.findAll('[data-test="user-delete"]')[1].trigger("click");
    expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(true);

    await wrapper.get('[data-test="confirm-accept"]').trigger("click");
    await flushPromises();

    expect(mocks.eliminar).toHaveBeenCalledWith("user-2");
    expect(mocks.success).toHaveBeenCalledWith("Usuario Ana Torres eliminado");
    expect(mocks.listar).toHaveBeenCalledTimes(2);
  });

  it("si eliminar falla muestra un toast de error y no recarga", async () => {
    mocks.eliminar.mockRejectedValue({ message: "No se pudo eliminar" });
    const { wrapper } = await montar();

    await wrapper.findAll('[data-test="user-delete"]')[1].trigger("click");
    await wrapper.get('[data-test="confirm-accept"]').trigger("click");
    await flushPromises();

    expect(mocks.error).toHaveBeenCalledWith("No se pudo eliminar");
    expect(mocks.listar).toHaveBeenCalledTimes(1);
  });

  it("limpiar filtros borra la query y el buscador", async () => {
    const { wrapper, router } = await montar("/usuarios?buscar=ana&rol=usuario");

    await wrapper.get('[data-test="users-clear-filters"]').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({});
    expect(wrapper.get('[data-test="users-search"]').element.value).toBe("");
  });

  it("si la página queda vacía retrocede a la anterior", async () => {
    mocks.listar.mockResolvedValue(respuesta({ usuarios: [], total: 8, pagina: 2, totalPaginas: 2 }));
    const { router } = await montar("/usuarios?pagina=2");

    await flushPromises();

    expect(router.currentRoute.value.query.pagina).toBe("1");
  });
});
