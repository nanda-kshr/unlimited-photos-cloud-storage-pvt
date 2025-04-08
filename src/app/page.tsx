'use client';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useEffect, useState } from "react";
import Loading from "@/components/ui/loading";
import { Label } from '@radix-ui/react-label';

export default function Home() {
  const Router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showApi, setShowApi] = useState("");
  const [showMongo, setShowMongo] = useState("");
  const [showMongoCollection, setShowMongoCollection] = useState("");
  const [error, setError] = useState(""); 

  useEffect(() => {
    const gettoken = async () => {
      const res = await fetch(`/api/v1/token`).then(res => res.json());
      const token = res.token;
      const chat = res.chat;
      setShowApi(token);
      localStorage.setItem("apiKey", token);
      localStorage.setItem("chatId", chat);
    };
    gettoken();
    setLoading(false);
  }, []);

  const handleApiKey = (e: ChangeEvent<HTMLInputElement>) => {
    setShowApi(e.target.value);
    localStorage.setItem("apiKey", e.target.value);
    if (e.target.value.trim()) {
      setError("");
    }
  };

  const handleMongoDB = (e: ChangeEvent<HTMLInputElement>) => {
    setShowMongo(e.target.value);
    localStorage.setItem("mongouri", e.target.value);
  };

  const handleMongoCollection = (e: ChangeEvent<HTMLInputElement>) => {
    setShowMongoCollection(e.target.value);
    localStorage.setItem("mongocollection", e.target.value);
  };

  const handleLogin = () => {
    if (!showApi.trim()) {
      setError("API Key is required.");
      return;
    }
    Router.push(`/upload`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading ? (
        <Loading />
      ) : (
        <Card className="w-full max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Enter Your Credentials</CardTitle>
            <CardDescription>
              Your credentials are securely stored in your local storage and are not shared externally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Label>Api Key*</Label>
              <Input
                placeholder="Enter your Bot Api Key"
                className="pr-10"
                value={showApi}
                onChange={(e) => handleApiKey(e)}
              />
              <span className="absolute inset-y-0 right-2 flex items-center top-6 group">
                <svg
                  className="w-5 h-5 text-gray-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden group-hover:block absolute bg-gray-700 text-white text-xs rounded py-1 px-2 -top-10 right-0 whitespace-nowrap">
                  Get this from your bot platform (e.g., Telegram BotFather).
                </span>
              </span>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="relative mb-4">
              <Label>MongoDB URI (Highly recommended for securing your files)</Label>
              <Input
                placeholder="Enter your MongoDB URI"
                className="pr-10"
                value={showMongo}
                onChange={(e) => handleMongoDB(e)}
              />
              <span className="absolute inset-y-0 right-2 flex items-center top-6 group">
                <svg
                  className="w-5 h-5 text-gray-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden group-hover:block absolute bg-gray-700 text-white text-xs rounded py-1 px-2 -top-10 right-0 whitespace-nowrap">
                  Obtain this from your MongoDB provider (e.g., MongoDB Atlas).
                </span>
              </span>
            </div>

            <div className="relative mb-4">
              <Label>MongoDB Collection</Label>
              <Input
                placeholder="Enter your MongoDB Collection Name"
                className="pr-10"
                value={showMongoCollection}
                onChange={(e) => handleMongoCollection(e)}
              />
              <span className="absolute inset-y-0 right-2 flex items-center top-6 group">
                <svg
                  className="w-5 h-5 text-gray-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden group-hover:block absolute bg-gray-700 text-white text-xs rounded py-1 px-2 -top-10 right-0 whitespace-nowrap">
                  This is the name of the collection in your MongoDB database (e.g., &quot;galleries&quot;).
                </span>
              </span>
            </div>
          </CardContent>
          <Button
            className="w-2/6 max-w-xl mx-auto"
            onClick={handleLogin}
            disabled={!showApi.trim()}
          >
            Login
          </Button>
        </Card>
      )}
    </div>
  );
}