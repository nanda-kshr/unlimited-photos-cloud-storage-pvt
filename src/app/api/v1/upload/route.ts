import { NextResponse } from 'next/server'
import createBot from '@/lib/telegram'
import handler from '../_connect/route';
import { Document } from 'mongodb';

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('key') as string
    const caption = formData.get('caption') as string || ""
    const mongouri = formData.get('mongouri') as string || ""
    const collectioName = formData.get('collection') as string || ""

    console.log("Mongouri: ", mongouri);
    console.log("Collection: ", collectioName);
    const {client, collection} = await handler(mongouri == ""?(process.env.MONGODB_URI):(mongouri), collectioName == ""?(process.env.MONGODB_COLLECTION):(collectioName));
    if (!file || !chatId || !userId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const bot = createBot(userId);
    const chatDetails = await bot.sendPhoto(chatId, buffer, { caption })
    const messageId = chatDetails.message_id
    const fileId = chatDetails.photo?.[chatDetails.photo.length - 1]?.file_id || ""
    const timestamp = new Date()
    
    const updateDoc: Document = {
      $push: {
        [`galleries.${chatId}`]: {
          messageId,
          timestamp,
          caption,
          fileId,
          uploadedAt: timestamp
        }
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
      message: '✅ Upload successful',
      imageInfo: {
        messageId,
        chatId,
        timestamp: timestamp.toISOString()
      }
    })
  } catch (error: unknown) {
    console.error('Error handling upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: '❌ Upload failed', error: errorMessage }, { status: 500 })
  }
}