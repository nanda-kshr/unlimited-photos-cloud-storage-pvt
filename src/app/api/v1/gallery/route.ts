import { NextResponse } from 'next/server';
import handler from '../_connect/route';
import bot from '@/lib/telegram';

interface GalleryItem {
  messageId: number;
  timestamp: Date | string;
  caption?: string;
  fileId: string;
  uploadedAt: Date | string;
}

interface EnhancedGalleryItem {
  messageId: number;
  timestamp: Date | string;
  caption: string;
  fileUrl: string | null;
  uploadedAt: Date | string;
}

interface GalleryData {
  [chatId: string]: EnhancedGalleryItem[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, userId, chatId, mongouri, collectionName } = body;



    const mongoUri = mongouri || process.env.MONGODB_URI;
    const collectionNm = collectionName || process.env.MONGODB_COLLECTION;

    if (!mongoUri || !collectionNm) {
      return NextResponse.json(
        { message: 'MongoDB URI and collection name are required' },
        { status: 400 }
      );
    }

    const {client, collection} = await handler(mongoUri, collectionNm);
    if (!collection) {
      throw new Error('Invalid MongoDB collection');
    }

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const query = { userId };
    let projection: { [key: string]: number } = {};

    if (chatId) {
      projection = { [`galleries.${chatId}`]: 1 };
    } else {
      projection = { galleries: 1 };
    }

    const userGallery = await collection.findOne(query, { projection });

    if (!userGallery || !userGallery.galleries) {
      return NextResponse.json({
        message: 'No images found for this user',
        galleryData: {} as GalleryData,
      });
    }

    let galleryData: { [chatId: string]: GalleryItem[] } = {};

    if (chatId && userGallery.galleries[chatId]) {
      const sortedItems = (userGallery.galleries[chatId] as GalleryItem[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      galleryData = { [chatId]: sortedItems };
    } else {
      Object.entries(userGallery.galleries).forEach(([id, images]) => {
        if (Array.isArray(images)) {
          galleryData[id] = (images as GalleryItem[]).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } else {
          galleryData[id] = [];
        }
      });
    }

    const enhancedGalleryData: GalleryData = {};

    for (const [chatId, images] of Object.entries(galleryData)) {
      enhancedGalleryData[chatId] = await Promise.all(
        images.map(async (item: GalleryItem): Promise<EnhancedGalleryItem> => {
          try {
            const fileInfo = await bot.getFile(item.fileId);
            const fileUrl = fileInfo.file_path
              ? `https://api.telegram.org/file/bot${apiKey==""?process.env.BOT_TOKEN:apiKey}/${fileInfo.file_path}`
              : null;

            return {
              messageId: item.messageId,
              timestamp: item.timestamp,
              caption: item.caption || '',
              fileUrl: fileUrl,
              uploadedAt: item.uploadedAt,
            };
          } catch (error) {
            console.error('Error fetching file URL:', error);
            return {
              messageId: item.messageId,
              timestamp: item.timestamp,
              caption: item.caption || '',
              fileUrl: null,
              uploadedAt: item.uploadedAt,
            };
          }
        })
      );
    }

    const totalChats = Object.keys(enhancedGalleryData).length;
    const totalImages = Object.values(enhancedGalleryData).reduce(
      (sum: number, images) => sum + (Array.isArray(images) ? images.length : 0),
      0
    );

    client.close();
    return NextResponse.json({
      userId,
      galleryData: enhancedGalleryData,
      totalChats,
      totalImages,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error retrieving gallery:', errorMessage);
    return NextResponse.json(
      { message: 'Failed to retrieve gallery', error: errorMessage },
      { status: 500 }
    );
  }
}