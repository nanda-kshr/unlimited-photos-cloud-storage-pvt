// /api/connect.js
import { MongoClient, Collection } from 'mongodb';


interface GalleryItem {
  messageId: number;
  timestamp: Date | string;
  caption?: string;
  fileId: string;
  uploadedAt: Date | string;
}

interface UserGalleryDocument {
  userId: string;
  galleries: {
    [chatId: string]: GalleryItem[];
  };
}


export default async function handler(
  mongouri: string | undefined,
  mongocollection: string | undefined
): Promise<{ client: MongoClient; collection: Collection<UserGalleryDocument> }> {
  if (!mongouri) {
    throw new Error('MongoURI is required but was not provided.');
  }
  const client = await MongoClient.connect(mongouri); 
  

  if (!mongocollection) {
    throw new Error('MongoDB collection name is required but was not provided.');
  }

  const db = client.db(mongocollection); 
  const collection = db.collection<UserGalleryDocument>(mongocollection);
  return { client, collection };
}
