// api/v1/inweb/delete/route.ts
import { NextResponse } from 'next/server';
import handler from '../../_connect/route';

interface DeleteRequest {
  apiKey: string;
  userId?: string;
  chatId: string;
  fileId?: string;
  messageId?: number;
  mongouri?: string;
  collectionName?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, userId, chatId, fileId, messageId, mongouri, collectionName } = body as DeleteRequest;

    if (!apiKey) return NextResponse.json({ message: 'apiKey required' }, { status: 400 });
    if (!chatId) return NextResponse.json({ message: 'chatId required' }, { status: 400 });
    if (!fileId && typeof messageId === 'undefined') return NextResponse.json({ message: 'fileId or messageId required' }, { status: 400 });

    const mongoUri = mongouri || process.env.MONGODB_URI;
    const collectionNm = collectionName || process.env.MONGODB_COLLECTION || 'UNLIMCLOUD';

    const { client, collection } = await handler(mongoUri, collectionNm);

    const user = userId || apiKey;

    // Soft-delete by setting `deleted: true` on the matching array element.
    const arrayFilter = fileId ? { 'elem.fileId': fileId } : { 'elem.messageId': messageId };
    const arrayFilterKey = fileId ? 'elem.fileId' : 'elem.messageId';

    const updateResult = await collection.updateOne(
      { userId: user },
      { $set: { [`galleries.${chatId}.$[elem].deleted`]: true } },
      { arrayFilters: [arrayFilter] }
    );

    client.close();

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ message: 'No matching item found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted (soft) from DB' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error soft-deleting item:', msg);
    return NextResponse.json({ message: 'Delete failed', error: msg }, { status: 500 });
  }
}
