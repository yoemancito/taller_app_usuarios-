// Validadores custom: los usa express-validator con .custom() en routes/
import Usuario, { ROLES } from "../models/usuario.js";

// El email no puede estar registrado por otro usuario.
// idPropio: al ACTUALIZAR, el id del usuario que se edita (su propio email no cuenta).
export const emailExiste = async (email = "", idPropio) => {
  const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() });

  if (usuario && usuario.id !== idPropio) {
    throw new Error("Ese email ya está registrado");
  }
};

export const esRolValido = (rol = "") => {
  if (!ROLES.includes(rol)) {
    throw new Error(`El rol debe ser uno de: ${ROLES.join(", ")}`);
  }
  return true;
};
