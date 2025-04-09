import { MongoClient } from "mongodb";

export const setupMongoDB = async (uri: string, collection: string | undefined) => {
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  const client = new MongoClient(uri);
  await client.connect();
  if (!collection) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_COLLECTION"');
  }
  const db = client.db(collection);
  return { db };
}