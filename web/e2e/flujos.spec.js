import { expect, test } from "@playwright/test";
import { ADMIN, USUARIO, apiCrearUsuario, apiRegistrar, emailUnico, iniciarSesion } from "./helpers.js";

test("login con credenciales incorrectas muestra el alert y sigue en /login", async ({ page }) => {
  await iniciarSesion(page, { email: ADMIN.email, password: "Incorrecta123" });

  await expect(page.getByTestId("alert")).toHaveText("Credenciales inválidas");
  await expect(page).toHaveURL(/\/login$/);
});

test("el admin inicia sesión y ve la lista de usuarios", async ({ page }) => {
  await iniciarSesion(page, ADMIN);

  await expect(page).toHaveURL(/\/usuarios$/);
  await expect(page.getByTestId("user-row").first()).toBeVisible();
  await expect(page.getByTestId("users-total")).toContainText("usuarios activos");
});

test("registro de una cuenta nueva entra al perfil con rol Usuario", async ({ page }, testInfo) => {
  const email = emailUnico(testInfo.project.name, "registro");
  await page.goto("/registro");
  await page.getByTestId("register-name").fill("Cuenta Nueva");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("Usuario123");
  await page.getByTestId("register-confirmation").fill("Usuario123");
  await page.getByTestId("register-submit").click();

  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByTestId("profile-role")).toHaveText("Usuario");
});

test("un usuario normal no puede abrir /usuarios y sin sesión va a /login", async ({ page }) => {
  await iniciarSesion(page, USUARIO);
  await expect(page).toHaveURL(/\/perfil$/);

  await page.goto("/usuarios");
  await expect(page).toHaveURL(/\/perfil$/);

  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/usuarios");
  await expect(page).toHaveURL(/\/login\?redirect=\/usuarios$/);
});

test("el admin crea un usuario, lo encuentra con el buscador y lo edita", async ({ page }, testInfo) => {
  const email = emailUnico(testInfo.project.name, "crud");
  await iniciarSesion(page, ADMIN);
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-new").click();
  await page.getByTestId("user-name").fill("Usuario Creado E2E");
  await page.getByTestId("user-email").fill(email);
  await page.getByTestId("user-password").fill("Usuario123");
  await page.getByTestId("user-submit").click();
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-search").fill(email);
  const fila = page.getByTestId("user-row").filter({ hasText: email });
  await expect(fila).toBeVisible();
  await fila.getByTestId("user-edit").click();

  await expect(page.getByTestId("user-name")).toHaveValue("Usuario Creado E2E");
  await page.getByTestId("user-name").fill("Usuario Editado E2E");
  await page.getByTestId("user-submit").click();
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-search").fill("Usuario Editado E2E");
  await expect(page.getByTestId("user-row").filter({ hasText: email })).toContainText("Usuario Editado E2E");
});

test("el admin elimina un usuario y ese usuario ya no puede iniciar sesión", async ({ page }, testInfo) => {
  const email = emailUnico(testInfo.project.name, "borrar");
  await apiCrearUsuario({ nombre: "Usuario Para Borrar", email, password: "Usuario123", rol: "usuario" });

  await iniciarSesion(page, ADMIN);
  await page.getByTestId("users-search").fill(email);
  const fila = page.getByTestId("user-row").filter({ hasText: email });
  await expect(fila).toBeVisible();

  await fila.getByTestId("user-delete").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await page.getByTestId("confirm-accept").click();
  await expect(page.getByTestId("toast")).toContainText("eliminado");
  await expect(page.getByTestId("user-row").filter({ hasText: email })).toHaveCount(0);

  await page.getByTestId("logout").click();
  await iniciarSesion(page, { email, password: "Usuario123" });
  await expect(page.getByTestId("alert")).toHaveText("Usuario desactivado");
  await expect(page).toHaveURL(/\/login$/);
});

test("filtro por rol y paginación cambian el listado", async ({ page }, testInfo) => {
  for (let i = 1; i <= 10; i++) {
    await apiCrearUsuario({
      nombre: `Paginacion ${testInfo.project.name} ${i}`,
      email: emailUnico(testInfo.project.name, `pagina${i}`),
      password: "Usuario123",
      rol: "usuario",
    });
  }

  await iniciarSesion(page, ADMIN);
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-role-filter").selectOption("admin");
  await expect(page.getByTestId("users-total")).toHaveText("2 usuarios activos");

  await page.getByTestId("users-role-filter").selectOption("");
  const infoInicial = await page.getByTestId("pagination-info").textContent();
  await page.getByTestId("pagination-next").click();
  await expect(page.getByTestId("pagination-info")).not.toHaveText(infoInicial);
});

test("el usuario cambia su contraseña, cierra sesión y entra con la nueva", async ({ page }, testInfo) => {
  const email = emailUnico(testInfo.project.name, "clave");
  await apiRegistrar({ nombre: "Cambio Clave", email, password: "Usuario123" });

  await iniciarSesion(page, { email, password: "Usuario123" });
  await expect(page).toHaveURL(/\/perfil$/);
  await page.getByTestId("password-current").fill("Usuario123");
  await page.getByTestId("password-new").fill("Nueva1234");
  await page.getByTestId("password-confirmation").fill("Nueva1234");
  await page.getByTestId("password-submit").click();
  await expect(page.getByTestId("toast")).toContainText("Contraseña actualizada");

  await page.getByTestId("logout").click();
  await iniciarSesion(page, { email, password: "Nueva1234" });
  await expect(page).toHaveURL(/\/perfil$/);
});

test("una ruta inexistente muestra la página de no encontrada", async ({ page }) => {
  await page.goto("/esta-ruta-no-existe");
  await expect(page.getByText("Página no encontrada")).toBeVisible();
  await expect(page.getByTestId("go-home")).toBeVisible();
});
