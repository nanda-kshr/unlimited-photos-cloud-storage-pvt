'use client';

import { useEffect, useState } from "react"
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
  const [chatId, setChatId] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [keepCompressed, setKeepCompressed] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey) {
      setApiKey(storedKey);
      setMongoUri(localStorage.getItem("mongouri") || "");
      setCollection(localStorage.getItem("mongocollection") || "");
      setChatId(localStorage.getItem("chatId") || "");
    } 
    setLoading(false);
  }, []);

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

    try {
      // Upload files sequentially
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('chatId', chatId.toString());
        formData.append('key', apiKey.toString());
        formData.append('mongouri', mongouri.toString());
        formData.append('collection', collection.toString());
        formData.append('compress', keepCompressed.toString());

        const response = await fetch('/api/v1/inweb/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.status === 429) {
          setError('Too many uploads');
          throw new Error('Too many uploads');
        }

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}: ${response.statusText}`);
        }

        await response.json();
      }

      setShowSuccess(true);
      setFiles([]); 
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

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
        </CardContent>
      </Card>
    </div>
  )
}

