import { Collection, MongoClient } from 'mongodb';
import { config } from './config';

export const getDbClient = async (mongouri: string): Promise<MongoClient> => {
  const client = new MongoClient(mongouri, {
    maxPoolSize: config.maxPoolSize,
    minPoolSize: config.minPoolSize,
  });
  await client.connect();
  return client;
};

export const getCollection = (client: MongoClient, collectionName: string): Collection => {
  return client.db().collection(collectionName);
};