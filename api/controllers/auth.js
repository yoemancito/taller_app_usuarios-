// SOLO lógica — el formato de los campos ya se validó en routes/auth.js
import Usuario from "../models/usuario.js";
import { generarJWT } from "../helpers/generar-jwt.js";

// POST /api/auth/login
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() });

    // Mensaje genérico: nunca avisar si falló el email o la contraseña
    if (!usuario || !usuario.validarPassword(password)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Usuario desactivado (borrado lógico) no puede entrar
    if (usuario.estado === false) {
      return res.status(401).json({ error: "Usuario desactivado" });
    }

    res.json({ token: generarJWT(usuario), usuario });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/registro — registro público: siempre crea rol "usuario"
export const registro = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const usuario = new Usuario({ nombre, email, password, rol: "usuario" });
    await usuario.save(); // aquí se dispara el hash del modelo

    res.status(201).json({ token: generarJWT(usuario), usuario });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/perfil — el usuario lo dejó validarJWT en req.usuario
export const perfil = (req, res) => {
  res.json(req.usuario);
};

// PUT /api/auth/perfil — el usuario edita su nombre y email
export const actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    const usuario = req.usuario;

    if (nombre !== undefined) usuario.nombre = nombre;
    if (email !== undefined) usuario.email = email;
    await usuario.save();

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/password
export const cambiarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuario = req.usuario;

    if (!usuario.validarPassword(passwordActual)) {
      return res.status(400).json({ error: "La contraseña actual no es correcta" });
    }

    if (passwordActual === passwordNueva) {
      return res.status(400).json({ error: "La nueva contraseña debe ser distinta de la actual" });
    }

    usuario.password = passwordNueva; // el hook pre("save") la hashea
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada" });
  } catch (error) {
    next(error);
  }
};
