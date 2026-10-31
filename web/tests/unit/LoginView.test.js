import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import LoginView from "@/views/LoginView.vue";

const auth = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock("@/composables/useAuth.js", () => ({
  useAuth: () => ({ login: auth.login }),
}));

async function montar(initial = "/login") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", name: "login", component: LoginView },
      { path: "/registro", name: "register", component: { template: "<div />" } },
      { path: "/perfil", name: "profile", component: { template: "<div />" } },
      { path: "/", name: "home", component: { template: "<div>home</div>" } },
    ],
  });
  await router.push(initial);
  await router.isReady();

  const wrapper = mount(LoginView, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe("LoginView", () => {
  beforeEach(() => {
    auth.login.mockReset();
  });

  it("con email inválido muestra el error sin llamar a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.get('[data-test="login-email"]').setValue("no-es-email");
    await wrapper.get('[data-test="login-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="login-form"]').trigger("submit");
    await flushPromises();

    expect(auth.login).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="login-email-error"]').text()).toBe("El email no tiene un formato válido");
  });

  it("con contraseña vacía muestra el error y no llama a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.get('[data-test="login-email"]').setValue("ana@demo.com");
    await wrapper.get('[data-test="login-form"]').trigger("submit");
    await flushPromises();

    expect(auth.login).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="login-password-error"]').text()).toBe("La contraseña es obligatoria");
  });

  it("con error del servidor muestra el alert y limpia la contraseña", async () => {
    auth.login.mockRejectedValue(new Error("Credenciales inválidas"));
    const { wrapper } = await montar();

    await wrapper.get('[data-test="login-email"]').setValue("ana@demo.com");
    await wrapper.get('[data-test="login-password"]').setValue("Incorrecta123");
    await wrapper.get('[data-test="login-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="alert"]').text()).toBe("Credenciales inválidas");
    expect(wrapper.get('[data-test="login-password"]').element.value).toBe("");
    expect(wrapper.get('[data-test="login-submit"]').text()).toBe("Entrar");
  });

  it("con credenciales correctas redirige al destino interno indicado", async () => {
    auth.login.mockResolvedValue();
    const { wrapper, router } = await montar("/login?redirect=/perfil");

    await wrapper.get('[data-test="login-email"]').setValue("ana@demo.com");
    await wrapper.get('[data-test="login-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="login-form"]').trigger("submit");
    await flushPromises();
    await router.isReady();

    expect(auth.login).toHaveBeenCalledWith({ email: "ana@demo.com", password: "Usuario123" });
    expect(router.currentRoute.value.fullPath).toBe("/perfil");
  });

  it("ignora un redirect externo y navega al inicio", async () => {
    auth.login.mockResolvedValue();
    const { wrapper, router } = await montar("/login?redirect=https://sitio-malo.com");

    await wrapper.get('[data-test="login-email"]').setValue("ana@demo.com");
    await wrapper.get('[data-test="login-password"]').setValue("Usuario123");
    await wrapper.get('[data-test="login-form"]').trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/");
  });
});
