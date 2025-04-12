'use client'

import { useEffect, useState, useRef } from "react"
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
  placeholderFileId?: string;
  placeholderFileUrl?: string | null;
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
  const [isFetching, setIsFetching] = useState(false);
  const [galleryData, setGalleryData] = useState<GalleryData>({});
  const [error, setError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalChats: 0, totalImages: 0 });
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    
    const fetchGallery = async (userId: string) => {
      try {
        setIsFetching(true);
        
        const response = await fetch(`/api/v1/inweb/gallery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            apiKey: localStorage.getItem("apiKey"), 
            userId, 
            mongouri: localStorage.getItem("mongouri") || "", 
            collectionName: localStorage.getItem("mongocollection") || "" 
          }),
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
        setIsFetching(false);
      }
    };
    
    if (storedKey) {
      fetchGallery(storedKey);
    } else {
      setError("API Key is missing. Please ensure you are logged in.");
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!activeChat || !galleryData[activeChat]) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Setup IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleImages(prev => {
                const newSet = new Set(prev);
                if (!newSet.has(messageId)) {
                  newSet.add(messageId);
                }
                return newSet;
              });
            }, 1000); // 1-second delay for each image
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    // Observe all cards
    cardRefs.current.forEach((card) => {
      if (card) observerRef.current?.observe(card);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [activeChat, galleryData]);

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
    setVisibleImages(new Set());
    setSelectedImage(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "https://placehold.co/400x300?text=Image+Not+Available";
  };

  const handleImageClick = (image: GalleryItem) => {
    setSelectedImage(image);
    setIsOriginalLoading(true);
  };

  const handleOriginalLoad = () => {
    setIsOriginalLoading(false);
  };

  const closePopup = () => {
    setSelectedImage(null);
    setIsOriginalLoading(false);
  };

  const setCardRef = (messageId: number, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(messageId, element);
    } else {
      cardRefs.current.delete(messageId);
    }
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
          {isFetching && Object.keys(galleryData).length === 0 ? (
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
                      ref={(el) => setCardRef(image.messageId, el)}
                      data-message-id={image.messageId}
                      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        {image.fileUrl ? (
                          visibleImages.has(image.messageId) ? (
                            <Image
                              src={image.placeholderFileUrl || image.fileUrl}
                              alt={image.caption || `Image ${image.messageId}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              onError={handleImageError}
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200">
                              <svg
                                className="w-8 h-8 text-gray-400 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                                />
                              </svg>
                            </div>
                          )
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

      {/* Popup for original image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full p-4">
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black hover:bg-gray-200 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {isOriginalLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
                <svg
                  className="w-12 h-12 text-gray-400 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
              </div>
            )}
            <Image
              src={selectedImage.fileUrl || "https://placehold.co/400x300?text=Image+Not+Available"}
              alt={selectedImage.caption || `Image ${selectedImage.messageId}`}
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={handleOriginalLoad}
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}