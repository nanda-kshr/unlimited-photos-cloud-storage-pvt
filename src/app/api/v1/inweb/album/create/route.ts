// api/v1/inweb/album/create/route.ts
import { NextResponse } from 'next/server';
import handler from '@/app/api/v1/_connect/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, userId, name, mongouri, collectionName } = body;
    if (!apiKey) return NextResponse.json({ message: 'apiKey required' }, { status: 400 });
    if (!name) return NextResponse.json({ message: 'name required' }, { status: 400 });

    const mongoUri = mongouri || process.env.MONGODB_URI;
    const collectionNm = collectionName || process.env.MONGODB_COLLECTION || 'UNLIMCLOUD';
    console.log('album/create - using mongoUri:', mongoUri, 'collection:', collectionNm);
    const { client, collection } = await handler(mongoUri, collectionNm);

    const user = userId || apiKey;
    const albumId = `alb_${Date.now()}`;
    const albumDoc = { userId: user, albumId, name, createdAt: new Date() };

    try {
      const db = (collection as any).s?.db || (collection as any).db || ((collection as any).client ? (collection as any).client.db() : undefined);
      const albumsColl = db.collection('albums');
      const res = await albumsColl.insertOne(albumDoc);
      client.close();
      return NextResponse.json({ message: 'Album created', album: { _id: res.insertedId, ...albumDoc } });
    } catch (err2) {
      client.close();
      throw err2;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Create album failed', msg);
    return NextResponse.json({ message: 'Failed', error: msg }, { status: 500 });
  }
}
