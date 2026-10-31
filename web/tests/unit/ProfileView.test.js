import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import ProfileView from "@/views/ProfileView.vue";

const mocks = vi.hoisted(() => {
  const state = {
    user: {
      uid: "1",
      nombre: "Ana Torres",
      email: "ana@demo.com",
      rol: "usuario",
      createdAt: "2025-01-15T12:00:00.000Z",
    },
  };
  return {
    state,
    setUser: vi.fn((user) => {
      state.user = user;
    }),
    success: vi.fn(),
    error: vi.fn(),
    actualizarPerfil: vi.fn(),
    cambiarPassword: vi.fn(),
  };
});

vi.mock("@/composables/useAuth.js", () => ({
  useAuth: () => ({ state: mocks.state, setUser: mocks.setUser }),
}));

vi.mock("@/composables/useToast.js", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));

vi.mock("@/services/authApi.js", () => ({
  authApi: {
    actualizarPerfil: mocks.actualizarPerfil,
    cambiarPassword: mocks.cambiarPassword,
  },
}));

const montar = () => mount(ProfileView);

describe("ProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = {
      uid: "1",
      nombre: "Ana Torres",
      email: "ana@demo.com",
      rol: "usuario",
      createdAt: "2025-01-15T12:00:00.000Z",
    };
  });

  it("muestra los datos del usuario y su rol", () => {
    const wrapper = montar();
    expect(wrapper.get('[data-test="profile-role"]').text()).toBe("Usuario");
    expect(wrapper.get('[data-test="profile-name"]').element.value).toBe("Ana Torres");
    expect(wrapper.get('[data-test="profile-email"]').element.value).toBe("ana@demo.com");
  });

  it("muestra Administrador cuando el rol es admin", () => {
    mocks.state.user = { ...mocks.state.user, rol: "admin" };
    const wrapper = montar();
    expect(wrapper.get('[data-test="profile-role"]').text()).toBe("Administrador");
  });

  it("con nombre inválido no llama a la API", async () => {
    const wrapper = montar();
    await wrapper.get('[data-test="profile-name"]').setValue("A");
    await wrapper.get('[data-test="profile-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.actualizarPerfil).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="profile-name-error"]').exists()).toBe(true);
  });

  it("guarda los cambios del perfil, actualiza la sesión y muestra toast", async () => {
    const actualizado = { ...mocks.state.user, nombre: "Ana Editada", email: "nueva@demo.com" };
    mocks.actualizarPerfil.mockResolvedValue(actualizado);
    const wrapper = montar();

    await wrapper.get('[data-test="profile-name"]').setValue("Ana Editada");
    await wrapper.get('[data-test="profile-email"]').setValue("nueva@demo.com");
    await wrapper.get('[data-test="profile-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.actualizarPerfil).toHaveBeenCalledWith({ nombre: "Ana Editada", email: "nueva@demo.com" });
    expect(mocks.setUser).toHaveBeenCalledWith(actualizado);
    expect(mocks.success).toHaveBeenCalledWith("Perfil actualizado");
    expect(wrapper.get('[data-test="profile-name"]').element.value).toBe("Ana Editada");
  });

  it("asigna al campo los errores por detalle que devuelve la API", async () => {
    mocks.actualizarPerfil.mockRejectedValue({
      message: "Revisa los datos del formulario",
      details: { email: "Ese email ya está registrado" },
    });
    const wrapper = montar();

    await wrapper.get('[data-test="profile-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="profile-email-error"]').text()).toBe("Ese email ya está registrado");
  });

  it("muestra error general del perfil cuando no hay detalles", async () => {
    mocks.actualizarPerfil.mockRejectedValue({ message: "Error interno", details: {} });
    const wrapper = montar();

    await wrapper.get('[data-test="profile-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="alert"]').text()).toBe("Error interno");
  });

  it("exige la contraseña actual antes de llamar a la API", async () => {
    const wrapper = montar();

    await wrapper.get('[data-test="password-new"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-confirmation"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="password-current-error"]').text()).toBe("Escribe tu contraseña actual");
  });

  it("rechaza que la confirmación no coincida", async () => {
    const wrapper = montar();

    await wrapper.get('[data-test="password-current"]').setValue("Usuario123");
    await wrapper.get('[data-test="password-new"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-confirmation"]').setValue("Otra1234");
    await wrapper.get('[data-test="password-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
    expect(wrapper.get('[data-test="password-confirmation-error"]').text()).toBe("Las contraseñas no coinciden");
  });

  it("cambia la contraseña correctamente, limpia el formulario y muestra toast", async () => {
    mocks.cambiarPassword.mockResolvedValue({ mensaje: "Contraseña actualizada" });
    const wrapper = montar();

    await wrapper.get('[data-test="password-current"]').setValue("Usuario123");
    await wrapper.get('[data-test="password-new"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-confirmation"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-form"]').trigger("submit");
    await flushPromises();

    expect(mocks.cambiarPassword).toHaveBeenCalledWith({
      passwordActual: "Usuario123",
      passwordNueva: "Nueva1234",
    });
    expect(mocks.success).toHaveBeenCalledWith("Contraseña actualizada");
    expect(wrapper.get('[data-test="password-new"]').element.value).toBe("");
  });

  it("muestra el error de la API en el campo passwordNueva", async () => {
    mocks.cambiarPassword.mockRejectedValue({
      message: "Revisa los datos del formulario",
      details: { passwordNueva: "La contraseña actual no es correcta" },
    });
    const wrapper = montar();

    await wrapper.get('[data-test="password-current"]').setValue("Mala1234");
    await wrapper.get('[data-test="password-new"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-confirmation"]').setValue("Nueva1234");
    await wrapper.get('[data-test="password-form"]').trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-test="password-new-error"]').text()).toBe("La contraseña actual no es correcta");
  });
});
