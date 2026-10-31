import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ToastContainer from "@/components/ToastContainer.vue";

const mocks = vi.hoisted(() => ({ toasts: [], dismiss: vi.fn() }));

vi.mock("@/composables/useToast.js", () => ({
  useToast: () => ({ toasts: mocks.toasts, dismiss: mocks.dismiss }),
}));

describe("ToastContainer", () => {
  beforeEach(() => {
    mocks.toasts = [];
    vi.clearAllMocks();
  });

  it("no renderiza toasts si la lista está vacía", () => {
    const wrapper = mount(ToastContainer);
    expect(wrapper.findAll('[data-test="toast"]')).toHaveLength(0);
  });

  it("renderiza cada toast con su tipo y permite cerrarlo", async () => {
    mocks.toasts = [
      { id: 1, message: "Guardado", type: "success" },
      { id: 2, message: "Falló", type: "error" },
    ];
    const wrapper = mount(ToastContainer);
    const toasts = wrapper.findAll('[data-test="toast"]');

    expect(toasts).toHaveLength(2);
    expect(toasts[0].text()).toContain("Guardado");
    expect(toasts[0].classes()).toContain("toast--success");
    expect(toasts[1].classes()).toContain("toast--error");

    await toasts[1].get("button").trigger("click");
    expect(mocks.dismiss).toHaveBeenCalledWith(2);
  });
});
