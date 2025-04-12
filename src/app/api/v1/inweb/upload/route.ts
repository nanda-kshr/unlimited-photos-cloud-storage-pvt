//api/v1/inweb/upload/route.ts

import { NextResponse } from 'next/server'
import {createBot} from '@/lib/telegram'
import handler from '../../_connect/route';
import { Document } from 'mongodb';
import sharp from 'sharp';

// Utility function to wait for a specified time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('image') as File[];
    const chatId = formData.get('chatId') as string;
    const userId = formData.get('key') as string;
    const mongouri = formData.get('mongouri') as string || "";
    const collectioName = formData.get('collection') as string || "";
    const compress = formData.get('compress') === 'true';
    const { client, collection } = await handler(
      mongouri === "" ? process.env.MONGODB_URI : mongouri,
      collectioName === "" ? process.env.MONGODB_COLLECTION : collectioName
    );

    if (!files.length || !chatId || !userId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const bot = createBot(userId);
    const timestamp = new Date();
    const uploadedImages: unknown[] = [];
    const galleryItems: unknown[] = [];

    for (const [index, file] of files.entries()) {
      // Add 1-second delay before each upload, except the first one
      if (index > 0) {
        await delay(1000); // Wait 1 second
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload original image as a document (no compression)
      const originalDocDetails = await bot.sendDocument(chatId, buffer);
      const originalMessageId = originalDocDetails.message_id;
      const originalFileId = originalDocDetails.document?.file_id || "";

      let placeholderFileId = "";

      // Upload compressed version as photo if compress is enabled
      if (compress) {
        const compressedBuffer = await sharp(buffer)
          .resize({
            width: Math.round((await sharp(buffer).metadata()).width! * 0.4),
            height: Math.round((await sharp(buffer).metadata()).height! * 0.4),
            fit: 'fill',
            kernel: 'nearest'
          })
          .jpeg({ quality: 60 })
          .toBuffer();

        const placeholderChatDetails = await bot.sendPhoto(chatId, compressedBuffer);
        placeholderFileId = placeholderChatDetails.photo?.[placeholderChatDetails.photo.length - 1]?.file_id || "";
      }

      const galleryItem = {
        messageId: originalMessageId,
        timestamp,
        fileId: originalFileId,
        uploadedAt: timestamp,
        ...(compress && placeholderFileId && { placeholder: placeholderFileId })
      };
      galleryItems.push(galleryItem);

      uploadedImages.push({
        messageId: originalMessageId,
        chatId,
        timestamp: timestamp.toISOString(),
        ...(compress && placeholderFileId && { placeholder: placeholderFileId })
      });
    }

    const updateDoc: Document = {
      $push: {
        [`galleries.${chatId}`]: { $each: galleryItems }
      },
      $set: { lastUpdated: timestamp }
    };

    await collection.updateOne(
      { userId },
      updateDoc,
      { upsert: true }
    );

    client.close();
    return NextResponse.json({ 
      message: 'Upload successful',
      imageInfo: uploadedImages
    });
  } catch (error: unknown) {
    console.error('Error handling upload:', error);
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({ message: 'Too many uploads, please try again later' }, { status: 429 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Upload failed', error: errorMessage }, { status: 500 });
  }
}