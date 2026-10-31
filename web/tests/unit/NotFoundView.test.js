import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import NotFoundView from "@/views/NotFoundView.vue";

describe("NotFoundView", () => {
  it("muestra el 404, el mensaje y el enlace al inicio", () => {
    const wrapper = mount(NotFoundView, {
      global: { stubs: { RouterLink: { template: '<a data-test="router-link"><slot /></a>' } } },
    });

    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Página no encontrada");
    expect(wrapper.get('[data-test="go-home"]').text()).toBe("Ir al inicio");
  });
});
