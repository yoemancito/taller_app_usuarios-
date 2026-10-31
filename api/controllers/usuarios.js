// SOLO lógica — el formato del id y de los campos ya se validó en routes/usuarios.js.
// Todas estas rutas exigen token + rol admin (validarJWT y validarRol).
// Como un admin no puede quitarse el rol ni eliminarse, siempre queda al menos uno.
import Usuario from "../models/usuario.js";

const LIMITE_POR_DEFECTO = 10;

// Escapa los caracteres especiales para usar el texto dentro de una RegExp
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/usuarios?buscar=&rol=&pagina=&limite=
export const listar = async (req, res, next) => {
  try {
    const { buscar, rol } = req.query;
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? LIMITE_POR_DEFECTO);

    const filtro = { estado: true }; // solo activos: los eliminados no se listan

    if (rol) filtro.rol = rol;
    if (buscar?.trim()) {
      const regex = new RegExp(escaparRegex(buscar.trim()), "i");
      filtro.$or = [{ nombre: regex }, { email: regex }];
    }

    const [total, usuarios] = await Promise.all([
      Usuario.countDocuments(filtro),
      Usuario.find(filtro)
        .collation({ locale: "es" }) // orden alfabético correcto con tildes
        .sort({ nombre: 1 })
        .skip((pagina - 1) * limite)
        .limit(limite),
    ]);

    res.json({
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
      usuarios,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/usuarios/:id
export const obtener = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario || !usuario.estado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// POST /api/usuarios — el hash lo hace el hook pre("save") del modelo
export const crear = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const usuario = new Usuario({ nombre, email, password, rol });
    await usuario.save();

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
};

// PUT /api/usuarios/:id — actualización parcial; password vacía = no se cambia
export const actualizar = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario || !usuario.estado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const esElMismo = usuario.id === req.usuario.id;

    if (esElMismo && rol !== undefined && rol !== usuario.rol) {
      return res.status(400).json({ error: "No puedes cambiar tu propio rol" });
    }

    if (nombre !== undefined) usuario.nombre = nombre;
    if (email !== undefined) usuario.email = email;
    if (rol !== undefined) usuario.rol = rol;
    if (password) usuario.password = password;

    // save() (y no findByIdAndUpdate) para que el hook hashee la nueva password
    await usuario.save();

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/usuarios/:id — borrado lógico: no se borra, se desactiva
export const eliminar = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario || !usuario.estado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
    }

    usuario.estado = false;
    await usuario.save();

    res.json({ mensaje: "Usuario eliminado", usuario });
  } catch (error) {
    next(error);
  }
};
