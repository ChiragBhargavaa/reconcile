import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "reconcile";

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

let indexesEnsured = false;

export async function connectDB(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(dbName);

  if (!indexesEnsured) {
    indexesEnsured = true;
    ensureIndexes(db).catch(() => {
      indexesEnsured = false;
    });
  }

  return db;
}

async function ensureIndexes(database: Db) {
  await database.collection("users").createIndex({ email: 1 }, { unique: true });
  await database.collection("users").createIndex({ username: 1 }, { unique: true, sparse: true });
  await database.collection("users").createIndex({ phone: 1 }, { unique: true, sparse: true });
  await database.collection("groups").createIndex({ memberIds: 1 });
  await database.collection("expenses").createIndex({ groupId: 1, createdAt: -1 });
  await database.collection("settlements").createIndex({ groupId: 1 });
  await database.collection("connections").createIndex({ userId1: 1, userId2: 1 }, { unique: true });
  await database.collection("connections").createIndex({ userId1: 1, status: 1 });
  await database.collection("friendlinks").createIndex({ code: 1 }, { unique: true });
}

export async function getDb(): Promise<Db> {
  return connectDB();
}
