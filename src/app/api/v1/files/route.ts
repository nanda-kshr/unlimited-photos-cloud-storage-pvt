//api/v1/files/route.ts
import { NextResponse } from 'next/server';
import { createBot } from '@/lib/telegram';
import handler from '../_connect/route';

interface FileRequest {
  fileId: string;
  apiKey: string;
  mongoUri: string;
  placeholderFileId?: string;
  userId?: string;
  chatId?: string;
}

interface GalleryItem {
  messageId: number;
  timestamp: Date | string;
  fileId: string;
  uploadedAt: Date | string;
  caption?: string;
  placeholder?: string; // Include placeholder as optional
}

interface FileUrlResponse {
  fileId: string;
  fileUrl: string | null;
  placeholderFileId: string;
  placeholderFileUrl: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, apiKey, mongoUri, placeholderFileId, userId, chatId } = body as FileRequest;

    if (!fileId) {
      return NextResponse.json(
        { message: 'fileId is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key is required' },
        { status: 400 }
      );
    }

    if (!mongoUri) {
      return NextResponse.json(
        { message: 'MongoDB URI is required' },
        { status: 400 }
      );
    }

    const bot = createBot(apiKey);
    let fileUrl: string | null = null;
    let finalPlaceholderFileId: string = placeholderFileId || "";
    let placeholderFileUrl: string | null = null;
    let message = "SUCCESS";

    // Get file URL
    try {
      const fileInfo = await bot.getFile(fileId);
      fileUrl = fileInfo.file_path
        ? `https://api.telegram.org/file/bot${apiKey}/${fileInfo.file_path}`
        : null;
    } catch (error) {
      console.error(`Error fetching file URL for fileId ${fileId}:`, error);
      message = "Error fetching file URL";
    }

    if (placeholderFileId) {
      try {
        const placeholderFileInfo = await bot.getFile(placeholderFileId);
        placeholderFileUrl = placeholderFileInfo.file_path
          ? `https://api.telegram.org/file/bot${apiKey}/${placeholderFileInfo.file_path}`
          : null;
      } catch (error) {
        console.error(`Error fetching placeholder file URL for placeholderFileId ${placeholderFileId}:`, error);
        message = "Placeholder file not found";
      }
    } else if (userId && chatId) {
      try {
        const { client, collection } = await handler(mongoUri, process.env.MONGODB_COLLECTION || 'defaultCollection');
        const query = { userId, [`galleries.${chatId}`]: { $exists: true } };
        const projection = { [`galleries.${chatId}`]: 1 };

        const userGallery = await collection.findOne(query, { projection });

        if (userGallery?.galleries?.[chatId]) {
          const galleryItems = userGallery.galleries[chatId] as GalleryItem[];
          const galleryItem = galleryItems.find((item) => item.fileId === fileId);
          if (galleryItem?.placeholder) {
            finalPlaceholderFileId = galleryItem.placeholder;
            try {
              const placeholderFileInfo = await bot.getFile(finalPlaceholderFileId);
              placeholderFileUrl = placeholderFileInfo.file_path
                ? `https://api.telegram.org/file/bot${apiKey}/${placeholderFileInfo.file_path}`
                : null;
            } catch (error) {
              console.error(`Error fetching placeholder file URL for placeholderFileId ${finalPlaceholderFileId}:`, error);
              message = "Placeholder file not found";
            }
          } else {
            message = "No placeholder found for the given fileId";
          }
        } else {
          message = "No gallery found for the specified chatId";
        }

        client.close();
      } catch (error) {
        message = "Error searching DB for placeholder";
        console.error('Error searching MongoDB for placeholder:', error);
      }
    } else {
      message = "No placeholder fileId provided and no userId/chatId for DB search";
    }

    const response: FileUrlResponse = {
      fileId,
      fileUrl,
      placeholderFileId: finalPlaceholderFileId,
      placeholderFileUrl,
    };

    return NextResponse.json({
      file: response,
      success: fileUrl !== null || placeholderFileUrl !== null,
      message,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing file URL:', errorMessage);
    return NextResponse.json(
      { message: 'Failed to retrieve file URL', error: errorMessage },
      { status: 500 }
    );
  }
}