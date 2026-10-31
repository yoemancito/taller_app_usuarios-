import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function importarToast() {
  const { useToast } = await import("@/composables/useToast.js");
  return useToast();
}

describe("useToast", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("success agrega un toast y lo elimina a los 3500 ms", async () => {
    const toast = await importarToast();

    const id = toast.success("Guardado");

    expect(toast.toasts).toHaveLength(1);
    expect(toast.toasts[0]).toMatchObject({ id, message: "Guardado", type: "success" });

    vi.advanceTimersByTime(3499);
    expect(toast.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts).toHaveLength(0);
  });

  it("error usa el tipo error y dura 5000 ms", async () => {
    const toast = await importarToast();

    toast.error("Falló");

    expect(toast.toasts[0].type).toBe("error");
    vi.advanceTimersByTime(4999);
    expect(toast.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts).toHaveLength(0);
  });

  it("permite cerrar un toast manualmente", async () => {
    const toast = await importarToast();
    const id = toast.success("Mensaje");

    toast.dismiss(id);

    expect(toast.toasts).toHaveLength(0);
  });

  it("ignora el cierre de un id que ya no existe", async () => {
    const toast = await importarToast();
    toast.success("Mensaje");

    expect(() => toast.dismiss(9999)).not.toThrow();
    expect(toast.toasts).toHaveLength(1);
  });

  it("varios toasts se acumulan con ids distintos", async () => {
    const toast = await importarToast();
    toast.success("Uno");
    toast.error("Dos");

    expect(toast.toasts).toHaveLength(2);
    expect(toast.toasts[0].id).not.toBe(toast.toasts[1].id);
  });
});
