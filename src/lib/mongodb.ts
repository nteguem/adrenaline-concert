import { MongoClient, Db } from "mongodb";

const uri = process.env.DATABASE_URL!;
const options = {
  minPoolSize: 5,
};

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoDb: Db | undefined;
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export async function getDatabase(): Promise<Db> {
  if (global._mongoDb) return global._mongoDb;
  const client = await clientPromise;
  global._mongoDb = client.db("adrenaline");
  return global._mongoDb;
}

export function isValidObjectId(id: string): boolean {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

export default clientPromise;
