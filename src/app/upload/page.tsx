'use client';

import { useEffect, useState } from "react"
import type { TelegramMessageResponse, TelegramDocumentResult, TelegramPhotoResult } from '@/types/telegram'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]) // Changed to array
  const [loading, setLoading] = useState(false); // Changed initial state to false
  const [apiKey, setApiKey] = useState<string>("");
  const [mongouri, setMongoUri] = useState<string>("");
  const [collection, setCollection] = useState<string>("");
  const [albums, setAlbums] = useState<Array<{albumId:string,name:string}>>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [chatId, setChatId] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [keepCompressed, setKeepCompressed] = useState(true);
  const [directUpload, setDirectUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey) {
      setApiKey(storedKey);
      setMongoUri(localStorage.getItem("mongouri") || "");
      setCollection(localStorage.getItem("mongocollection") || "");
      setChatId(localStorage.getItem("chatId") || "");
    } 
    // Placeholder for future logic
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    const fetchAlbums = async () => {
      try {
        const res = await fetch('/api/v1/inweb/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, userId: apiKey, mongouri: mongouri || '', collectionName: collection || '' })
        });
        if (!res.ok) return;
        const data = await res.json();
        setAlbums((data && data.albums) || []);
      } catch (e) {
          void e
        }
    }
    fetchAlbums();
  }, [apiKey, mongouri, collection]);

  const Router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles)); // Convert FileList to Array
    }
  }

  const handleChatId = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChatId(event.target.value);
    localStorage.setItem("chatId", event.target.value);
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one file first.")
      return
    }
    setLoading(true);
    setShowSuccess(false);

    if (!apiKey) {
      Router.push(`/`);
      setLoading(false);
      return;
    }

    const results: Array<Record<string, unknown>> = [];
    try {
      if (directUpload) {
        // Attempt direct browser -> Telegram upload
        for (const file of files) {
          // send original as document
          const docForm = new FormData();
          docForm.append('chat_id', chatId.toString());
          docForm.append('document', file, file.name);

          // Use XHR to get upload progress
          const sendDocJson = await uploadWithProgress<TelegramMessageResponse<TelegramDocumentResult>>(`https://api.telegram.org/bot${apiKey}/sendDocument`, docForm, (p) => {
            setUploadProgress(prev => {
              const next = { ...prev, [file.name]: p };
              const vals = Object.values(next);
              const avg = Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
              setOverallProgress(avg);
              return next;
            });
          });
          const messageId = sendDocJson.result?.message_id;
          const fileId = sendDocJson.result?.document?.file_id;
          let placeholderFileId: string | undefined;

          if (keepCompressed && file.type.startsWith('image/')) {
            // create compressed placeholder using canvas
            const compressedBlob = await (async () => {
              try {
                const bitmap = await createImageBitmap(file);
                const scale = 0.4;
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(bitmap.width * scale);
                canvas.height = Math.round(bitmap.height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) return null;
                ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.6));
              } catch (err) {
                  void err
                  console.warn('Compression failed for', file.name, err instanceof Error ? err.message : err);
                  return null;
                }
            })();

            if (compressedBlob) {
              const photoForm = new FormData();
              photoForm.append('chat_id', chatId.toString());
              photoForm.append('photo', compressedBlob, 'placeholder.jpg');
                try {
                  const photoJson = await uploadWithProgress<TelegramMessageResponse<TelegramPhotoResult>>(`https://api.telegram.org/bot${apiKey}/sendPhoto`, photoForm, (p) => {
                    setUploadProgress(prev => {
                      const next = { ...prev, [file.name + '-thumb']: p };
                      const vals = Object.values(next);
                      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
                      setOverallProgress(avg);
                      return next;
                    });
                  });
                  placeholderFileId = photoJson.result?.photo?.[photoJson.result.photo.length - 1]?.file_id;
                } catch (e) {
                  console.warn('Placeholder upload failed for', file.name, e instanceof Error ? e.message : e);
                }
                  
            }
          }

          // register metadata in server DB
          const registerBody = {
            apiKey,
            userId: apiKey,
            chatId,
            fileId,
            messageId,
            placeholderFileId,
            mongouri: mongouri || undefined,
            collectionName: collection || undefined,
            albumId: selectedAlbum || undefined,
          };

          const regRes = await fetch('/api/v1/inweb/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerBody),
          });

          if (!regRes.ok) {
            console.warn('Registration failed for', file.name, await regRes.text().catch(() => ''));
          }
          results.push({ name: file.name, success: true, fileId, messageId });
        }

        setShowSuccess(true);
        setFiles([]);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        // Server-mediated upload (existing flow) using XHR to track progress
        for (const file of files) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('chatId', chatId.toString());
          formData.append('key', apiKey.toString());
          formData.append('mongouri', mongouri.toString());
          formData.append('collection', collection.toString());
          formData.append('compress', keepCompressed.toString());

          formData.append('albumId', selectedAlbum || '')
          const responseJson = await uploadWithProgress('/api/v1/inweb/upload', formData, (p) => {
            setUploadProgress(prev => {
              const next = { ...prev, [file.name]: p };
              const vals = Object.values(next);
              const avg = Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
              setOverallProgress(avg);
              return next;
            });
          });
          // response may contain imageInfo array
          results.push({ name: file.name, success: true, response: responseJson });
        }

        setShowSuccess(true);
        setFiles([]);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error during upload');
      const isCors = (error instanceof TypeError);
      if (isCors) {
        alert('Direct browser upload failed (likely CORS). Use server upload or deploy a proxy.');
      } else {
        alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
      setOverallProgress(0);
      setUploadProgress({});
      console.log('per-file results:', results);
    }
  }

  // helper to upload with progress using XHR
  const uploadWithProgress = <T = unknown>(url: string, body: FormData, onProgress: (p: number) => void): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.withCredentials = false;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as unknown as T);
          } catch (e) {
            console.warn(e);
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(body);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Pictures</CardTitle>
          <CardDescription>This is an unlimited private storage for your images.</CardDescription>
          <CardDescription>Dont upload more than 10 Images at a time </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSuccess && (
            <Alert className="bg-green-50 border-green-500 text-green-700 mb-4">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your files have been successfully uploaded to Telegram.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="bg-red-50 border-red-500 text-red-700 mb-4">
              <CheckCircle className="h-4 w-4 text-red-500 mr-2" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          <label
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            onDrop={(e) => {
              e.preventDefault();
              const droppedFiles = e.dataTransfer.files;
              if (droppedFiles) {
                setFiles(Array.from(droppedFiles));
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {files.length > 0 ? (
              <div className="text-center text-gray-600 max-h-40 overflow-y-auto">
                <p>Selected Files:</p>
                <ul className="list-disc list-inside">
                  {files.map((file, index) => (
                    <li key={index} className="font-medium truncate" title={file.name}>
                      {file.name}
                    </li>
                  ))}
                </ul>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file) => {
                      const p = uploadProgress[file.name] ?? 0;
                      return (
                        <div key={file.name} className="w-full">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span className="truncate max-w-xs">{file.name}</span>
                            <span>{p}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-2 bg-blue-500" style={{ width: `${p}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Drag and drop files here, or click to select multiple files
              </p>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              id="file-upload"
              multiple // Added multiple attribute
            />
          </label>
          <div className="flex items-center gap-2">
            <Label htmlFor="chat-id">
              Enter your ChatID
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="w-80 p-3 bg-white shadow-lg rounded-md border text-black">
                  <div className="space-y-2">
                    <p className="font-semibold">How to get your Chat ID:</p>
                    <ol className="text-sm list-decimal ml-4 space-y-1">
                      <li>Open Telegram</li>
                      <li>Create a private channel</li>
                      <li>Send a message</li>
                      <li>Forward it to <a href="https://t.me/jsondumpbot" className="text-blue-600 hover:underline">@jsondumpbot</a></li>
                      <li>Get the chat ID</li>
                      <li>Paste it here</li>
                    </ol>
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      Disclaimer: You should add the bot to the channel as admin and allow all permissions.
                    </p>
                    <p className="text-xs text-black-500 mt-2 font-medium">
                      For more help :- go to <span><a className="text-blue-500" href='https://github.com/nanda-kshr/unlimited-photos-cloud-storage'>Github</a></span>
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id="chat-id"
            placeholder="Eg: -1001233434890" 
            className="mb-4" 
            value={chatId}
            onChange={(e) => handleChatId(e)}
          />
          <div className="mb-4">
            <Label>Upload to Album</Label>
            <select className="w-full p-2 border rounded" value={selectedAlbum} onChange={(e)=>setSelectedAlbum(e.target.value)}>
              <option value="">(none)</option>
              {albums.map(a=> <option key={a.albumId} value={a.albumId}>{a.name || a.albumId}</option>)}
            </select>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <Input 
              type="checkbox" 
              value="" 
              className="sr-only peer" 
              onChange={(e) => setKeepCompressed(e.target.checked)} 
              checked
            />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Need Thumbnail Optimization?</span>
          </label>

          <label className="inline-flex items-center cursor-pointer">
            <Input
              type="checkbox"
              value=""
              className="sr-only peer"
              onChange={(e) => setDirectUpload(e.target.checked)}
              checked={directUpload}
            />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            <div className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Upload directly from browser (insecure, may be blocked by CORS)</div>
          </label>
          <Button
            className="w-full mt-6"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? (
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
            ) : (
              <>Upload to Telegram</>
            )}
          </Button>
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">Overall: {overallProgress}%</div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-green-500" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

