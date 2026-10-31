import { expect } from "@playwright/test";

export const API = "http://127.0.0.1:3000/api";
export const ADMIN = { email: "admin@demo.com", password: "Admin123!" };
export const USUARIO = { email: "ana@demo.com", password: "Usuario123" };

export async function iniciarSesion(page, { email, password }) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok).toBeTruthy();
  return res.json();
}

export async function apiCrearUsuario(datos) {
  const { token } = await apiLogin(ADMIN);
  const res = await fetch(`${API}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-token": token },
    body: JSON.stringify(datos),
  });
  expect(res.status).toBe(201);
  return res.json();
}

export async function apiRegistrar(datos) {
  const res = await fetch(`${API}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  expect(res.status).toBe(201);
  return res.json();
}

export function emailUnico(project, prefijo = "e2e") {
  return `${prefijo}-${project}-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`;
}
