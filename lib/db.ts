import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "reconcile";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
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
  await database.collection("phoneverifications").createIndex({ userId: 1 });
}

export async function getDb(): Promise<Db> {
  if (!db) return connectDB();
  return db;
}
