import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["admin", "usuario"];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    // lowercase + trim: "  ANA@Demo.com " se guarda como "ana@demo.com"
    email: { type: String, required: [true, "El email es obligatorio"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, "La contraseña es obligatoria"] },
    rol: { type: String, enum: ROLES, default: "usuario" },
    estado: { type: Boolean, default: true }, // false = borrado lógico
  },
  { timestamps: true } // createdAt y updatedAt automáticos
);

// Hook pre("save"): hashea SIEMPRE antes de guardar.
// Ojo: solo si la password cambió (si no, re-hashea un hash y el login se rompe)
usuarioSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

// Compara la contraseña escrita con el hash guardado
usuarioSchema.methods.validarPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Nunca devolver la password en un JSON; y "uid" en lugar de "_id"
usuarioSchema.methods.toJSON = function () {
  const { _id, __v, password, ...usuario } = this.toObject();
  return { uid: _id, ...usuario };
};

export default mongoose.model("Usuario", usuarioSchema);
