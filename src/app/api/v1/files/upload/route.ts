//api/v1/files/upload/route.ts

import { NextResponse } from 'next/server';
import { createBot } from '@/lib/telegram';
import { getDbClient, getCollection } from '@/lib/db';
import { getSession, setSession, updateSessionTimestamp } from '@/lib/session';
import { config } from '@/lib/config';
import sharp from 'sharp';
import { MongoClient, Document} from 'mongodb';

interface GalleryItem {
  messageId: number;
  timestamp: Date;
  fileId: string;
  uploadedAt: Date;
  placeholder?: string;
}

interface UploadedImage {
  messageId: number;
  chatId: string;
  timestamp: string;
  placeholder?: string;
}

const isValidImage = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(file.type);
};

const retryOnRateLimit = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && error.message.includes('429') && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
};

const getSessionKey = (apiKey: string, mongouri: string) => `${apiKey}:${mongouri}`;
console.log(getSessionKey)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('image') as File[];
    const chatId = formData.get('chatId')?.toString();
    const apiKey = formData.get('key')?.toString();
    const mongouri = formData.get('mongouri')?.toString() || config.mongodbDefaultUri;
    const collectionName = formData.get('collection')?.toString() || config.mongodbDefaultCollection;
    const compress = formData.get('compress') === 'true';
    if (!files.length || !chatId || !apiKey || !mongouri || !collectionName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (files.some((file) => !isValidImage(file))) {
      return NextResponse.json({ message: 'Only images (jpeg, png, webp, gif) are allowed' }, { status: 400 });
    }

    const sessionKey = getSessionKey(apiKey, mongouri);
    const session = getSession(sessionKey);
    let client: MongoClient;

    if (!session) {
      client = await getDbClient(mongouri);
      setSession(sessionKey, client);
      console.log(`New session created`);
    } else {
      client = session.client;
      updateSessionTimestamp(sessionKey);
      console.log(`Reusing session`);
    }

    const collection = getCollection(client, collectionName);
    const bot = createBot(apiKey || config.telegramApiTokenEnv);
    const timestamp = new Date();
    const uploadedImages: UploadedImage[] = [];
    const galleryItems: GalleryItem[] = [];
    const fileIds: { fileId: string; placeholderId?: string }[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const docResult = await retryOnRateLimit(() =>
        bot.sendDocument(chatId, buffer)
      );
      const messageId = docResult.message_id;
      const fileId = docResult.document?.file_id;
      let placeholderFileId: string | undefined;

      if (compress) {
        const compressedBuffer = await sharp(buffer)
          .resize({
            width: Math.round((await sharp(buffer).metadata()).width! * 0.5),
            height: Math.round((await sharp(buffer).metadata()).height! * 0.5),
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 75 })
          .toBuffer();

        const photoResult = await retryOnRateLimit(() => bot.sendPhoto(chatId, compressedBuffer));
        placeholderFileId = photoResult.photo?.[photoResult.photo.length - 1]?.file_id;
      }
        fileIds.push({ fileId: fileId || '', placeholderId: placeholderFileId });

      if (!fileId) {
        throw new Error('Failed to retrieve fileId from Telegram');
      }

      

      const galleryItem: GalleryItem = { messageId, timestamp, fileId, uploadedAt: timestamp, ...(placeholderFileId && { placeholder: placeholderFileId }) };
      galleryItems.push(galleryItem);


      uploadedImages.push({
        messageId,
        chatId,
        timestamp: timestamp.toISOString(),
        ...(placeholderFileId && { placeholder: placeholderFileId }),
      });
    }
    
    const userId = apiKey;
    const updateDoc: Document = {
          $push: {
            [`galleries.${chatId}`]: { $each: galleryItems }
          },
          $set: { lastUpdated: timestamp }
        };
    await collection.updateOne({ userId }, updateDoc, { upsert: true });
    return NextResponse.json({ message: 'Upload successful', fileIds: fileIds });
  } catch (error) {
    console.error('Error handling upload:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('429') ? 429 : 500;
    return NextResponse.json(
      { message: status === 429 ? 'Too many uploads, please try again later' : 'Upload failed', error: message },
      { status }
    );
  }
}