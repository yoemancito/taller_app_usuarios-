import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/App.vue";

const mocks = vi.hoisted(() => ({ authenticated: false }));

vi.mock("@/composables/useAuth.js", async () => {
  const { computed } = await import("vue");
  return { useAuth: () => ({ isAuthenticated: computed(() => mocks.authenticated) }) };
});

async function montar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", name: "home", component: { template: "<p>contenido</p>" } }],
  });
  await router.push("/");
  await router.isReady();

  return mount(App, {
    global: {
      plugins: [router],
      stubs: { AppHeader: { template: '<header data-test="header-stub" />' }, ToastContainer: true },
    },
  });
}

describe("App", () => {
  beforeEach(() => {
    mocks.authenticated = false;
  });

  it("sin sesión no muestra el header y centra el contenido", async () => {
    const wrapper = await montar();

    expect(wrapper.find('[data-test="header-stub"]').exists()).toBe(false);
    expect(wrapper.get(".layout__content").classes()).toContain("layout__content--centered");
  });

  it("con sesión muestra el header y el contenido normal", async () => {
    mocks.authenticated = true;
    const wrapper = await montar();

    expect(wrapper.find('[data-test="header-stub"]').exists()).toBe(true);
    expect(wrapper.get(".layout__content").classes()).not.toContain("layout__content--centered");
    expect(wrapper.text()).toContain("contenido");
  });
});
