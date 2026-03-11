// api/v1/inweb/album/create/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import handler from '@/app/api/v1/_connect/route';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey : undefined;
    const userId = typeof body.userId === 'string' ? body.userId : undefined;
    const name = typeof body.name === 'string' ? body.name : undefined;
    const mongouri = typeof body.mongouri === 'string' ? body.mongouri : undefined;
    const collectionName = typeof body.collectionName === 'string' ? body.collectionName : undefined;
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
      const db = (collection as unknown as any).s?.db || (collection as unknown as any).db || ((collection as unknown as any).client ? (collection as unknown as any).client.db() : undefined);
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
