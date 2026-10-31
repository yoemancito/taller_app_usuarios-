import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import Usuario from "../models/usuario.js";

const URI = process.env.MONGODB_CNX ?? "mongodb://127.0.0.1:27099/app-usuarios-test";

beforeAll(async () => {
  await mongoose.connect(URI);
});

// Cada prueba arranca con la colección vacía: ninguna depende del orden.
afterEach(async () => {
  await Usuario.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});
