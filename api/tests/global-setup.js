// Levanta UNA instancia de MongoDB en memoria para toda la ejecución.
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

export async function setup() {
  mongod = await MongoMemoryServer.create({
    instance: { port: 27099, dbName: "app-usuarios-test" },
  });
}

export async function teardown() {
  await mongod?.stop();
}
