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
    const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || '20971520', 10); // 20 MB default
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
    const albumId = formData.get('albumId') as string || "";

    const database = (collection as any).s?.db || (collection as any).db || ((collection as any).client ? (collection as any).client.db() : undefined);
    const albumsColl = database.collection('albums');
    const linksColl = database.collection('album_links');
    const uploadedImages: unknown[] = [];
    const galleryItems: unknown[] = [];

    for (const [index, file] of files.entries()) {
      // Guard: reject very large files early with a helpful message.
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ message: `File too large. Max allowed: ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB` }, { status: 413 });
      }
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

      const fileTimestamp = new Date();
      const galleryItem = {
        messageId: originalMessageId,
        timestamp: fileTimestamp,
        fileId: originalFileId,
        uploadedAt: fileTimestamp,
        ...(compress && placeholderFileId && { placeholder: placeholderFileId })
      };

      uploadedImages.push({
        messageId: originalMessageId,
        chatId,
        timestamp: fileTimestamp.toISOString(),
        ...(compress && placeholderFileId && { placeholder: placeholderFileId })
      });

      // Persist this file immediately so earlier successes are not lost on later failures
      try {
        await collection.updateOne(
          { userId },
          {
            $push: { [`galleries.${chatId}`]: galleryItem },
            $set: { lastUpdated: fileTimestamp }
          },
          { upsert: true }
        );
        // If albumId was provided, link this messageId to that album (if album exists)
        if (albumId) {
          try {
            const targetAlbum = await albumsColl.findOne({ userId, albumId });
            if (targetAlbum) {
              await linksColl.updateOne(
                { albumId: targetAlbum._id, messageId: originalMessageId },
                { $setOnInsert: { albumId: targetAlbum._id, messageId: originalMessageId, fileId: originalFileId, chatId, userId, createdAt: fileTimestamp } },
                { upsert: true }
              );
            }
          } catch (e) {
            console.error('Error linking uploaded image to album:', e);
          }
        }
      } catch (dbErr) {
        console.error('Failed to save gallery item to DB for file:', originalFileId, dbErr);
        // continue — we don't want a DB failure to block remaining uploads
      }
    }

    // galleryItems already persisted per-file above; no final batched update needed.

    client.close();
    return NextResponse.json({ 
      message: 'Upload successful',
      imageInfo: uploadedImages
    });
  } catch (error: unknown) {
    console.error('Error handling upload:', error);
    const message = error instanceof Error ? error.message : '';
    // Handle common network/socket errors with clearer response
    if (message.includes('429')) {
      return NextResponse.json({ message: 'Too many uploads, please try again later' }, { status: 429 });
    }
    if (message.includes('socket hang up') || message.includes('EFATAL')) {
      return NextResponse.json({ message: 'Network error uploading to Telegram (socket hang up). Try a smaller file or use direct browser upload/proxy.', error: message }, { status: 502 });
    }

    const errorMessage = message || 'Unknown error';
    return NextResponse.json({ message: 'Upload failed', error: errorMessage }, { status: 500 });
  }
}