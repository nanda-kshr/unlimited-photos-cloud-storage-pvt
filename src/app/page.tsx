'use client';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChangeEvent, useEffect, useState } from "react";
import Loading from "@/components/ui/loading";

export default  function  Home() {
  const Router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showApi, setShowApi] = useState("");

  useEffect(() => {
    const gettoken = async() => {
      const res = await fetch(`/api/v1/token`).then(res => res.json())
      const token = res.token;
      const chat = res.chat;
      setShowApi(token)
      localStorage.setItem("apiKey", token);
      localStorage.setItem("chatId", chat);
    }
    gettoken();
    setLoading(false);
  },[])

  const handleApiKey = async(e: ChangeEvent<HTMLInputElement>) => {
    setShowApi(e.target.value);
    localStorage.setItem("apiKey", e.target.value);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading ? (
              <Loading/>
            ) : (
              
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Enter Your API-KEY</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <Input 
            placeholder="Enter your Bot Api Key" 
            className="mb-4" 
            value={showApi}
            onChange={(e) => handleApiKey(e)}
          />
        </CardContent>
        <Button 
          className="w-2/6 max-w-xl mx-auto" 
          onClick={() => { Router.push(`/upload`); }}
        >
          Login
        </Button>
      </Card>
    )}
    </div>
  );
}
