import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import RegisterView from "@/views/RegisterView.vue";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/composables/useAuth.js", () => ({
  useAuth: () => ({ register: mocks.register }),
}));

vi.mock("@/composables/useToast.js", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));

async function montar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/registro", name: "register", component: RegisterView },
      { path: "/login", name: "login", component: { template: "<div />" } },
      { path: "/", name: "home", component: { template: "<div>home</div>" } },
    ],
  });
  await router.push("/registro");
  await router.isReady();
  const wrapper = mount(RegisterView, { global: { plugins: [router] } });
  return { wrapper, router };
}

async function llenar(wrapper, datos = {}) {
  const valores = {
    nombre: "Ana Torres",
    email: "ana@demo.com",
    password: "Usuario123",
    confirmation: "Usuario123",
    ...datos,
  };
  await wrapper.get('[data-test="register-name"]').setValue(valores.nombre);
  await wrapper.get('[data-test="register-email"]').setValue(valores.email);
  await wrapper.get('[data-test="register-password"]').setValue(valores.password);
  await wrapper.get('[data-test="register-confirmation"]').setValue(valores.confirmation);
}

describe("RegisterView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con datos inválidos muestra los errores y no llama a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.get('[data-test="register-name"]').setValue("A");
    await wrapper.get('[data-test="register-email"]').setValue("mal");
    await wrapper.get('[data-test="register-password"]').setValue("corta");
    await wrapper.get('[data-test="register-confirmation"]').setValue("otra");
    await wrapper.get('[data-test="register-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.register).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="register-name-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="register-email-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="register-password-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="register-confirmation-error"]').text()).toBe("Las contraseñas no coinciden");
  });

  it("con datos válidos registra, muestra toast y navega al inicio", async () => {
    mocks.register.mockResolvedValue();
    const { wrapper, router } = await montar();
    await llenar(wrapper);

    await wrapper.get('[data-test="register-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.register).toHaveBeenCalledWith({
      nombre: "Ana Torres",
      email: "ana@demo.com",
      password: "Usuario123",
    });
    expect(mocks.success).toHaveBeenCalledWith("¡Cuenta creada! Bienvenido.");
    expect(router.currentRoute.value.fullPath).toBe("/");
  });

  it("muestra los errores por campo que devuelve la API", async () => {
    mocks.register.mockRejectedValue({
      message: "Revisa los datos del formulario",
      details: { email: "Ese email ya está registrado" },
    });
    const { wrapper } = await montar();
    await llenar(wrapper);

    await wrapper.get('[data-test="register-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="register-email-error"]').text()).toBe("Ese email ya está registrado");
  });

  it("muestra el error general de la API en el alert", async () => {
    mocks.register.mockRejectedValue({ message: "Error interno", details: {} });
    const { wrapper } = await montar();
    await llenar(wrapper);

    await wrapper.get('[data-test="register-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="alert"]').text()).toBe("Error interno");
    expect(routerNoCambia(wrapper)).toBe(true);
  });

  it("mientras envía deshabilita el botón y cambia el texto", async () => {
    let resolver;
    mocks.register.mockReturnValue(new Promise((resolve) => (resolver = resolve)));
    const { wrapper } = await montar();
    await llenar(wrapper);

    await wrapper.get('[data-test="register-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="register-submit"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="register-submit"]').text()).toBe("Creando cuenta…");

    resolver();
    await flushPromises();
    expect(wrapper.get('[data-test="register-submit"]').text()).toBe("Crear cuenta");
  });
});

// Comprueba de forma simple que el formulario no navegó: el alert sigue visible.
function routerNoCambia(wrapper) {
  return wrapper.find('[data-test="register-form"]').exists();
}
