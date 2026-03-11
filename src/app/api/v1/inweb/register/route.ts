// api/v1/inweb/register/route.ts
import { NextResponse } from 'next/server';
import handler from '../../_connect/route';
import { ObjectId } from 'mongodb';

interface RegisterRequest {
  apiKey: string;
  userId?: string;
  chatId: string;
  fileId: string;
  messageId: number;
  placeholderFileId?: string;
  mongouri?: string;
  collectionName?: string;
  albumId?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, userId, chatId, fileId, placeholderFileId, messageId, mongouri, collectionName, albumId } = body as RegisterRequest;

    if (!apiKey) {
      return NextResponse.json({ message: 'apiKey is required' }, { status: 400 });
    }
    if (!chatId) {
      return NextResponse.json({ message: 'chatId is required' }, { status: 400 });
    }
    if (!fileId) {
      return NextResponse.json({ message: 'fileId is required' }, { status: 400 });
    }

    const mongoUri = mongouri || process.env.MONGODB_URI;
    const collectionNm = collectionName || process.env.MONGODB_COLLECTION || 'UNLIMCLOUD';

    const { client, collection } = await handler(mongoUri, collectionNm);

    const timestamp = new Date();
    const user = userId || apiKey;

    const galleryItem: any = {
      messageId,
      timestamp,
      fileId,
      uploadedAt: timestamp,
    };
    if (placeholderFileId) galleryItem.placeholder = placeholderFileId;

    const updateDoc = {
      $push: { [`galleries.${chatId}`]: { $each: [galleryItem] } },
      $set: { lastUpdated: timestamp }
    };

    // Ensure user document exists and add gallery item
    await collection.updateOne({ userId: user }, updateDoc, { upsert: true });

    // Ensure default 'All' album exists in `albums` collection and link this messageId in `album_links`.
    try {
      const db = (collection as any).s.db || (collection as any).db || (collection as any).collection?.db?.();
      // fallback: use client.db() if available
      const database = (collection as any).s?.db || (collection as any).db || ((collection as any).client ? (collection as any).client.db() : undefined);
      const albumsColl = database.collection('albums');
      const linksColl = database.collection('album_links');

      // Find 'All' album for this user
      let allAlbum = await albumsColl.findOne({ userId: user, albumId: 'all' });
      if (!allAlbum) {
        const insertRes = await albumsColl.insertOne({ userId: user, albumId: 'all', name: 'All', createdAt: timestamp });
        allAlbum = { _id: insertRes.insertedId, userId: user, albumId: 'all', name: 'All', createdAt: timestamp };
      }

      // Link the image to the album in a junction collection
      await linksColl.updateOne(
        { albumId: allAlbum._id, messageId },
        { $setOnInsert: { albumId: allAlbum._id, messageId, fileId, chatId, userId: user, createdAt: timestamp } },
        { upsert: true }
      );

      // If caller requested a specific album, link there as well
      if (albumId && albumId !== 'all') {
        try {
          const targetAlbum = await albumsColl.findOne({ userId: user, albumId });
          if (targetAlbum) {
            await linksColl.updateOne(
              { albumId: targetAlbum._id, messageId },
              { $setOnInsert: { albumId: targetAlbum._id, messageId, fileId, chatId, userId: user, createdAt: timestamp } },
              { upsert: true }
            );
          }
        } catch (e) {
          console.error('Error linking to requested album:', e);
        }
      }
    } catch (dbErr) {
      console.error('Error ensuring/adding to All album (collections):', dbErr);
    }

    client.close();

    return NextResponse.json({ message: 'Registered', fileId, placeholderFileId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error registering upload:', msg);
    return NextResponse.json({ message: 'Registration failed', error: msg }, { status: 500 });
  }
}
