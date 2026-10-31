import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";

const mocks = vi.hoisted(() => ({
  state: { user: { uid: "1", nombre: "Ana Torres", rol: "usuario" } },
  isAdmin: false,
  logout: vi.fn(),
}));

vi.mock("@/composables/useAuth.js", async () => {
  const { computed } = await import("vue");
  return {
    useAuth: () => ({
      state: mocks.state,
      isAdmin: computed(() => mocks.isAdmin),
      logout: mocks.logout,
    }),
  };
});

async function montar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      { path: "/login", name: "login", component: { template: "<div />" } },
      { path: "/usuarios", name: "users", component: { template: "<div />" } },
      { path: "/perfil", name: "profile", component: { template: "<div />" } },
    ],
  });
  await router.push("/perfil");
  await router.isReady();
  const wrapper = mount(AppHeader, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe("AppHeader", () => {
  beforeEach(() => {
    mocks.isAdmin = false;
    vi.clearAllMocks();
  });

  it("muestra el nombre, las iniciales y el rol", async () => {
    const { wrapper } = await montar();

    expect(wrapper.get('[data-test="current-user-name"]').text()).toBe("Ana Torres");
    expect(wrapper.get(".avatar").text()).toBe("AT");
    expect(wrapper.text()).toContain("Usuario");
    expect(wrapper.find('[data-test="nav-users"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="nav-profile"]').exists()).toBe(true);
  });

  it("muestra el enlace de usuarios para un admin", async () => {
    mocks.isAdmin = true;
    const { wrapper } = await montar();

    expect(wrapper.find('[data-test="nav-users"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Administrador");
  });

  it("abre y cierra el menú móvil", async () => {
    const { wrapper } = await montar();
    const toggle = wrapper.get(".header__toggle");

    expect(toggle.attributes("aria-expanded")).toBe("false");
    await toggle.trigger("click");
    expect(toggle.attributes("aria-expanded")).toBe("true");
    expect(wrapper.get("#main-nav").classes()).toContain("header__nav--open");
  });

  it("cierra sesión y navega al login", async () => {
    const { wrapper, router } = await montar();

    await wrapper.get('[data-test="logout"]').trigger("click");
    await flushPromises();

    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.name).toBe("login");
  });
});
