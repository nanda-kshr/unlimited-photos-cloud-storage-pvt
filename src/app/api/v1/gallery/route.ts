import { NextResponse } from 'next/server';
import { collection } from "@/lib/mongodb";
import bot from '@/lib/telegram';

// Define the GalleryItem interface to match your data structure
interface GalleryItem {
  messageId: number;
  timestamp: Date | string; // Allow string since MongoDB might return it
  caption?: string;
  fileId: string;
  uploadedAt: Date | string;
}

// Define the enhanced item type with fileUrl
interface EnhancedGalleryItem {
  messageId: number;
  timestamp: Date | string;
  caption: string;
  fileUrl: string | null;
  uploadedAt: Date | string;
}

// Define the gallery data structure
interface GalleryData {
  [chatId: string]: EnhancedGalleryItem[];
}

export async function GET(request: Request) {
  try {
    // Get query parameters and log request details
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const chatId = url.searchParams.get('chatId');
    
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`[${currentDate}] Request received:`, { userId, chatId, url: request.url });

    if (!userId) {
      console.log(`[${currentDate}] Validation failed: User ID is required`);
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    const query = { userId };
    let projection: { [key: string]: number } = {};
    
    if (chatId) {
      console.log(`[${currentDate}] Filtering for specific chatId: ${chatId}`);
      projection = { [`galleries.${chatId}`]: 1 };
    } else {
      console.log(`[${currentDate}] Fetching all galleries for user: ${userId}`);
      projection = { galleries: 1 };
    }
    
    console.log(`[${currentDate}] Querying MongoDB:`, { query, projection });
    const userGallery = await collection.findOne(query, { projection });
    
    if (!userGallery || !userGallery.galleries) {
      console.log(`[${currentDate}] No gallery data found for user: ${userId}`);
      return NextResponse.json({ 
        message: 'No images found for this user',
        galleryData: {} as GalleryData 
      });
    }
    
    let galleryData: { [chatId: string]: GalleryItem[] } = {};
    
    if (chatId && userGallery.galleries[chatId]) {
      console.log(`[${currentDate}] Processing gallery for chatId: ${chatId}`);
      const sortedItems = (userGallery.galleries[chatId] as GalleryItem[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      galleryData = { [chatId]: sortedItems };
    } else {
      console.log(`[${currentDate}] Processing all galleries for user: ${userId}`);
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

    // Generate Telegram file URLs for each fileId
    console.log(`[${currentDate}] Generating Telegram file URLs...`);
    const enhancedGalleryData: GalleryData = {};
    
    for (const [chatId, images] of Object.entries(galleryData)) {
      enhancedGalleryData[chatId] = await Promise.all(
        images.map(async (item: GalleryItem): Promise<EnhancedGalleryItem> => {
          try {
            const fileInfo = await bot.getFile(item.fileId);
            const fileUrl = fileInfo.file_path 
              ? `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`
              : null;
            
            // Return only essential data with fileUrl as the main image source
            return {
              messageId: item.messageId,
              timestamp: item.timestamp,
              caption: item.caption || '',
              fileUrl: fileUrl, // Primary image URL
              uploadedAt: item.uploadedAt
            };
          } catch (error) {
            console.error(`[${currentDate}] Failed to get file info for fileId ${item.fileId}:`, error);
            // Return item with null fileUrl if there's an error
            return {
              messageId: item.messageId,
              timestamp: item.timestamp,
              caption: item.caption || '',
              fileUrl: null, // Error case
              uploadedAt: item.uploadedAt
            };
          }
        })
      );
    }

    const totalChats = Object.keys(enhancedGalleryData).length;
    const totalImages = Object.values(enhancedGalleryData).reduce(
      (sum: number, images) => sum + (Array.isArray(images) ? images.length : 0), 0
    );

    console.log(`[${currentDate}] Response ready: ${totalChats} chats, ${totalImages} images`);
    
    return NextResponse.json({
      userId,
      galleryData: enhancedGalleryData,
      totalChats,
      totalImages
    });
    
  } catch (error: unknown) {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.error(`[${currentDate}] Error retrieving gallery:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to retrieve gallery', error: errorMessage }, 
      { status: 500 }
    );
  }
}