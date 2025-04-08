'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface GalleryItem {
  messageId: number;
  timestamp: Date;
  caption: string;
  fileUrl: string | null;
  uploadedAt: Date;
}

interface GalleryData {
  [chatId: string]: GalleryItem[];
}

interface GalleryResponse {
  userId: string;
  galleryData: GalleryData;
  totalChats: number;
  totalImages: number;
}

export default function Gallery() {
  const [loading, setLoading] = useState(true);
  const [galleryData, setGalleryData] = useState<GalleryData>({});
  const [error, setError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalChats: 0, totalImages: 0 });
  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    
    const fetchGallery = async (userId: string) => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/v1/gallery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: localStorage.getItem("apiKey"), userId, mongouri: localStorage.getItem("mongouri") || "", collectionName: localStorage.getItem("mongocollection") || "" }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch gallery: ${response.statusText}`);
        }

        const data: GalleryResponse = await response.json();
        
        if (data.galleryData && Object.keys(data.galleryData).length > 0) {
          setGalleryData(data.galleryData);
          setActiveChat(Object.keys(data.galleryData)[0]);
          setStats({
            totalChats: data.totalChats,
            totalImages: data.totalImages
          });
        } else {
          setGalleryData({});
          setStats({ totalChats: 0, totalImages: 0 });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error fetching gallery');
      } finally {
        setLoading(false);
      }
    };
    
    if (storedKey) {
      fetchGallery(storedKey);
    } else {
      setError("API Key is missing. Please ensure you are logged in.");
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleChatChange = (chatId: string) => {
    setActiveChat(chatId);
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "https://placehold.co/400x300?text=Image+Not+Available";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Card className="flex-1 m-6">
        <CardHeader>
          <CardTitle>Image Gallery</CardTitle>
          <CardDescription>
            Browse your uploaded images
            {stats.totalImages > 0 && (
              <span className="ml-2 text-sm font-medium">
                ({stats.totalChats} chats, {stats.totalImages} images)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg
                aria-hidden="true"
                className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8">
              <p>{error}</p>
            </div>
          ) : Object.keys(galleryData).length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              <p>No images found. Upload some images to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto whitespace-nowrap">
                {Object.keys(galleryData).map((chatId) => (
                  <button
                    key={chatId}
                    onClick={() => handleChatChange(chatId)}
                    className={`px-4 py-2 mr-2 mb-1 rounded-md ${
                      activeChat === chatId 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white hover:bg-gray-200'
                    }`}
                  >
                    Chat {chatId.slice(-4)} ({galleryData[chatId].length})
                  </button>
                ))}
              </div>
              
              {activeChat && galleryData[activeChat] && galleryData[activeChat].length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {galleryData[activeChat].map((image) => (
                    <div
                      key={image.messageId}
                      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        {image.fileUrl ? (
                          <Image
                            src={image.fileUrl}
                            alt={image.caption || `Image ${image.messageId}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            onError={handleImageError}
                            unoptimized
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-center p-4 text-gray-400">
                            Image not available
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        {image.caption && (
                          <p className="font-medium text-sm mb-1 truncate" title={image.caption}>
                            {image.caption}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{formatDate(image.timestamp)}</span>
                          <span>ID: {image.messageId.toString().slice(-4)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeChat ? (
                <div className="text-center text-gray-500 py-12">
                  <p>No images found in this chat.</p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}