import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import AlertMessage from "@/components/AlertMessage.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import FormField from "@/components/FormField.vue";
import PaginationBar from "@/components/PaginationBar.vue";

describe("AlertMessage", () => {
  it("no renderiza nada sin mensaje", () => {
    const wrapper = mount(AlertMessage, { props: { message: "" } });
    expect(wrapper.find('[data-test="alert"]').exists()).toBe(false);
  });

  it("muestra el mensaje con el rol y el tipo indicado", () => {
    const wrapper = mount(AlertMessage, { props: { message: "Credenciales inválidas", type: "error" } });
    const alerta = wrapper.get('[data-test="alert"]');

    expect(alerta.text()).toBe("Credenciales inválidas");
    expect(alerta.attributes("role")).toBe("alert");
    expect(alerta.classes()).toContain("alert--error");
  });
});

describe("FormField", () => {
  it("asocia label, input y muestra el error con data-test", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email", testId: "login-email", error: "El email no tiene un formato válido" },
    });
    const input = wrapper.get('[data-test="login-email"]');
    const error = wrapper.get('[data-test="login-email-error"]');

    expect(wrapper.get("label").text()).toBe("Email");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(input.attributes("aria-describedby")).toBe(error.attributes("id"));
    expect(error.text()).toBe("El email no tiene un formato válido");
  });

  it("muestra la pista cuando no hay error", () => {
    const wrapper = mount(FormField, {
      props: { label: "Contraseña", hint: "Mínimo 8 caracteres", testId: "pass" },
    });

    expect(wrapper.text()).toContain("Mínimo 8 caracteres");
    expect(wrapper.find('[data-test="pass-error"]').exists()).toBe(false);
  });

  it("el botón Mostrar/Ocultar cambia el tipo del input", async () => {
    const wrapper = mount(FormField, {
      props: { label: "Contraseña", type: "password", testId: "login-password" },
    });
    const input = wrapper.get('[data-test="login-password"]');
    const toggle = wrapper.get('[data-test="login-password-toggle"]');

    expect(input.attributes("type")).toBe("password");
    expect(toggle.text()).toBe("Mostrar");

    await toggle.trigger("click");
    expect(input.attributes("type")).toBe("text");
    expect(toggle.text()).toBe("Ocultar");

    await toggle.trigger("click");
    expect(input.attributes("type")).toBe("password");
  });

  it("actualiza el v-model al escribir", async () => {
    const wrapper = mount(FormField, { props: { label: "Nombre", testId: "nombre" } });
    await wrapper.get('[data-test="nombre"]').setValue("Ana");

    expect(wrapper.emitted("update:modelValue")[0]).toEqual(["Ana"]);
  });

  it("usa el type text por defecto y no muestra el botón de contraseña", () => {
    const wrapper = mount(FormField, { props: { label: "Nombre", testId: "nombre" } });
    expect(wrapper.get('[data-test="nombre"]').attributes("type")).toBe("text");
    expect(wrapper.find('[data-test="nombre-toggle"]').exists()).toBe(false);
  });
});

describe("PaginationBar", () => {
  it("en la página 1 muestra el rango y deshabilita Anterior", () => {
    const wrapper = mount(PaginationBar, { props: { page: 1, totalPages: 3, total: 20, limit: 8 } });

    expect(wrapper.get('[data-test="pagination-info"]').text()).toBe("Mostrando 1–8 de 20");
    expect(wrapper.get('[data-test="pagination-page"]').text()).toBe("Página 1 de 3");
    expect(wrapper.get('[data-test="pagination-prev"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="pagination-next"]').attributes("disabled")).toBeUndefined();
  });

  it("emite change con la página siguiente", async () => {
    const wrapper = mount(PaginationBar, { props: { page: 1, totalPages: 3, total: 20, limit: 8 } });

    await wrapper.get('[data-test="pagination-next"]').trigger("click");

    expect(wrapper.emitted("change")[0]).toEqual([2]);
  });

  it("en la última página deshabilita Siguiente y emite la anterior", async () => {
    const wrapper = mount(PaginationBar, { props: { page: 3, totalPages: 3, total: 20, limit: 8 } });

    expect(wrapper.get('[data-test="pagination-next"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="pagination-info"]').text()).toBe("Mostrando 17–20 de 20");

    await wrapper.get('[data-test="pagination-prev"]').trigger("click");
    expect(wrapper.emitted("change")[0]).toEqual([2]);
  });

  it("con total 0 muestra 0–0 de 0", () => {
    const wrapper = mount(PaginationBar, { props: { page: 1, totalPages: 1, total: 0, limit: 8 } });
    expect(wrapper.get('[data-test="pagination-info"]').text()).toBe("Mostrando 0–0 de 0");
  });
});

describe("ConfirmDialog", () => {
  const montar = (props = {}) =>
    mount(ConfirmDialog, {
      props: { open: true, title: "Eliminar usuario", message: "No podrá iniciar sesión", ...props },
      global: { stubs: { Teleport: true } },
      attachTo: document.body,
    });

  it("no renderiza el diálogo si open es false", () => {
    const wrapper = montar({ open: false });
    expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(false);
  });

  it("muestra título, mensaje y emite confirm", async () => {
    const wrapper = montar();

    expect(wrapper.text()).toContain("Eliminar usuario");
    expect(wrapper.text()).toContain("No podrá iniciar sesión");

    await wrapper.get('[data-test="confirm-accept"]').trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });

  it("emite cancel con el botón cancelar", async () => {
    const wrapper = montar();
    await wrapper.get('[data-test="confirm-cancel"]').trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("con loading deshabilita botones y muestra Procesando", () => {
    const wrapper = montar({ loading: true });

    expect(wrapper.get('[data-test="confirm-accept"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="confirm-cancel"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="confirm-accept"]').text()).toBe("Procesando…");
  });

  it("pulsa Escape y emite cancel si no está cargando", async () => {
    const wrapper = montar();
    await wrapper.get(".dialog-backdrop").trigger("keydown", { key: "Escape" });
    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("al abrir pone el foco en Cancelar", async () => {
    const wrapper = montar({ open: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    expect(document.activeElement?.dataset.test).toBe("confirm-cancel");
  });
});
