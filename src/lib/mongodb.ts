import { MongoClient } from "mongodb";

// if (!process.env.MONGODB_URI) {
//   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
// }

// const uri = process.env.MONGODB_URI;

// const client = new MongoClient(uri);

// await client.connect();

// if (!process.env.MONGODB_COLLECTION) {
//     throw new Error('Invalid/Missing environment variable: "MONGODB_COLLECTION"');
// }

// export const db = client.db(process.env.MONGODB_COLLECTION);
// export const collection = db.collection(process.env.MONGODB_COLLECTION);
// export default client;

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