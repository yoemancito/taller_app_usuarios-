import { describe, expect, it } from "vitest";
import {
  isValid,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/utils/validators.js";

describe("validateName", () => {
  it("rechaza un nombre vacío", () => {
    expect(validateName("   ")).toBe("El nombre es obligatorio");
  });

  it("rechaza un nombre de un solo carácter", () => {
    expect(validateName("A")).toBe("El nombre debe tener entre 2 y 60 caracteres");
  });

  it("rechaza un nombre de más de 60 caracteres", () => {
    expect(validateName("a".repeat(61))).toBe("El nombre debe tener entre 2 y 60 caracteres");
  });

  it("acepta un nombre válido e ignora espacios externos", () => {
    expect(validateName("  Ana Torres  ")).toBe("");
  });
});

describe("validateEmail", () => {
  it("rechaza un email vacío", () => {
    expect(validateEmail("")).toBe("El email es obligatorio");
  });

  it("rechaza un email sin formato válido", () => {
    expect(validateEmail("ana@sin-punto")).toBe("El email no tiene un formato válido");
    expect(validateEmail("ana.com")).toBe("El email no tiene un formato válido");
  });

  it("acepta un email válido", () => {
    expect(validateEmail(" ana@demo.com ")).toBe("");
  });
});

describe("validatePassword", () => {
  it("rechaza una contraseña vacía", () => {
    expect(validatePassword("")).toBe("La contraseña es obligatoria");
  });

  it("rechaza una contraseña corta", () => {
    expect(validatePassword("Ab1")).toBe("La contraseña debe tener entre 8 y 64 caracteres");
  });

  it("rechaza una contraseña de más de 64 caracteres", () => {
    expect(validatePassword(`A1${"a".repeat(63)}`)).toBe("La contraseña debe tener entre 8 y 64 caracteres");
  });

  it("rechaza una contraseña sin mayúscula", () => {
    expect(validatePassword("usuariolargo1")).toBe("La contraseña debe incluir al menos una mayúscula");
  });

  it("rechaza una contraseña sin minúscula", () => {
    expect(validatePassword("USUARIOLARGO1")).toBe("La contraseña debe incluir al menos una minúscula");
  });

  it("rechaza una contraseña sin número", () => {
    expect(validatePassword("UsuarioLargo")).toBe("La contraseña debe incluir al menos un número");
  });

  it("acepta una contraseña que cumple todas las reglas", () => {
    expect(validatePassword("Usuario123")).toBe("");
  });
});

describe("validatePasswordConfirmation", () => {
  it("exige repetir la contraseña", () => {
    expect(validatePasswordConfirmation("Usuario123", "")).toBe("Repite la contraseña");
  });

  it("rechaza contraseñas distintas", () => {
    expect(validatePasswordConfirmation("Usuario123", "Usuario124")).toBe("Las contraseñas no coinciden");
  });

  it("acepta contraseñas iguales", () => {
    expect(validatePasswordConfirmation("Usuario123", "Usuario123")).toBe("");
  });
});

describe("isValid", () => {
  it("devuelve true solo si ningún campo tiene mensaje", () => {
    expect(isValid({ email: "", password: "" })).toBe(true);
    expect(isValid({ email: "", password: "Error" })).toBe(false);
  });
});
