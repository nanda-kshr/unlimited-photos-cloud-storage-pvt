// api/v1/inweb/album/modify/route.ts
import { NextResponse } from 'next/server';
import handler from '@/app/api/v1/_connect/route';

interface ModifyBody {
  apiKey: string;
  userId?: string;
  albumId: string;
  action: 'add' | 'remove';
  messageId?: number | number[];
  messageIds?: number[];
  fileId?: string;
  mongouri?: string;
  collectionName?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ModifyBody;
    const { apiKey, userId, albumId, action, messageId, fileId, mongouri, collectionName } = body;
    if (!apiKey || !albumId || !action) return NextResponse.json({ message: 'apiKey/albumId/action required' }, { status: 400 });

    const mongoUri = mongouri || process.env.MONGODB_URI;
    const collectionNm = collectionName || process.env.MONGODB_COLLECTION || 'UNLIMCLOUD';
    const { client, collection } = await handler(mongoUri, collectionNm);
    const user = userId || apiKey;

    // Use albums collection and album_links junction collection
    const db = (collection as any).s?.db || (collection as any).db || ((collection as any).client ? (collection as any).client.db() : undefined);
    const albumsColl = db.collection('albums');
    const linksColl = db.collection('album_links');

    // find album
    const albumDoc = await albumsColl.findOne({ userId: user, albumId });
    if (!albumDoc) {
      client.close();
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }

    if (action === 'add') {
      const ids: number[] = [];
      if (Array.isArray(messageId)) ids.push(...messageId);
      else if (typeof messageId === 'number') ids.push(messageId);
      else if (Array.isArray((body as any).messageIds)) ids.push(...(body as any).messageIds);
      if (ids.length === 0 && !fileId) return NextResponse.json({ message: 'messageId(s) or fileId required to add' }, { status: 400 });

      if (ids.length > 0) {
        const ops = ids.map(id => ({
          updateOne: {
            filter: { albumId: albumDoc._id, messageId: id },
            update: { $setOnInsert: { albumId: albumDoc._id, messageId: id, fileId: null, userId: user, createdAt: new Date() } },
            upsert: true
          }
        }));
        if (ops.length > 0) await linksColl.bulkWrite(ops);
      } else if (fileId) {
        await linksColl.updateOne(
          { albumId: albumDoc._id, fileId },
          { $setOnInsert: { albumId: albumDoc._id, messageId: null, fileId, userId: user, createdAt: new Date() } },
          { upsert: true }
        );
      }
      client.close();
      return NextResponse.json({ message: 'Added to album' });
    }

    if (action === 'remove') {
      const ids: number[] = [];
      if (Array.isArray(messageId)) ids.push(...messageId);
      else if (typeof messageId === 'number') ids.push(messageId);
      else if (Array.isArray((body as any).messageIds)) ids.push(...(body as any).messageIds);
      if (ids.length > 0) {
        await linksColl.deleteMany({ albumId: albumDoc._id, messageId: { $in: ids } });
        client.close();
        return NextResponse.json({ message: 'Removed from album' });
      }
      if (fileId) {
        await linksColl.deleteOne({ albumId: albumDoc._id, fileId });
        client.close();
        return NextResponse.json({ message: 'Removed from album' });
      }
      return NextResponse.json({ message: 'messageId(s) or fileId required to remove' }, { status: 400 });
    }

    client.close();
    return NextResponse.json({ message: 'No action performed' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Modify album failed', msg);
    return NextResponse.json({ message: 'Failed', error: msg }, { status: 500 });
  }
}
