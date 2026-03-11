'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Album {
  albumId: string
  name: string
  images: Array<number | string>
  createdAt?: string
}

export default function Gallery() {
  const [isFetching, setIsFetching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [error, setError] = useState<string | null>(null)
  const [newAlbumName, setNewAlbumName] = useState<string>('')
  const [totalImages, setTotalImages] = useState<number>(0)

  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey')
    if (!storedKey) {
      setError('API Key is missing. Please ensure you are logged in.')
      return
    }

    const fetchGallery = async () => {
      try {
        setIsFetching(true)
        const res = await fetch('/api/v1/inweb/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: storedKey,
            userId: storedKey,
            mongouri: localStorage.getItem('mongouri') || '',
            collectionName: localStorage.getItem('mongocollection') || '',
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setAlbums((data as any).albums || [])
        setTotalImages((data && data.totalImages) || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsFetching(false)
      }
    }

    fetchGallery()
  }, [])

  const handleCreateAlbum = async (name: string) => {
    if (!name) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/v1/inweb/album/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: localStorage.getItem('apiKey'),
          name,
          mongouri: localStorage.getItem('mongouri') || '',
          collectionName: localStorage.getItem('mongocollection') || '',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setAlbums((prev) => [...prev, json.album])
      setNewAlbumName('')
    } catch (err) {
      console.error('Create album failed', err)
      setError('Failed to create album')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Card className="flex-1 m-6">
        <CardHeader>
          <CardTitle>Albums</CardTitle>
          <CardDescription>
            Browse or create albums. Total images: {totalImages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="New album name"
              className="px-3 py-2 border rounded-md w-64"
            />
            <button
              onClick={() => handleCreateAlbum(newAlbumName.trim())}
              className="px-3 py-2 bg-blue-600 text-white rounded-md"
              disabled={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create album'}
            </button>
          </div>

          {isFetching ? (
            <div className="text-center text-gray-500 p-4">Loading albums…</div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">{error}</div>
          ) : albums.length === 0 ? (
            <div className="text-center text-gray-500 p-4">No albums yet. Create one above.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(() => {
                const allAlbum = albums.find(a => a.albumId === 'all');
                if (allAlbum) {
                  return (
                    <Link key={allAlbum.albumId} href={`/gallery/album/${allAlbum.albumId}`} className="p-4 border rounded-md hover:shadow">
                      <div className="font-medium">{allAlbum.name || 'All images'}</div>
                      <div className="text-xs text-gray-500">{allAlbum.images?.length || totalImages} images</div>
                    </Link>
                  )
                }
                return (
                  <Link href={`/gallery/album/all`} className="p-4 border rounded-md hover:shadow">
                    <div className="font-medium">All images</div>
                    <div className="text-xs text-gray-500">{totalImages} images</div>
                  </Link>
                )
              })()}

              {albums.filter(a => a.albumId !== 'all').map((alb) => (
                <Link key={alb.albumId} href={`/gallery/album/${alb.albumId}`} className="p-4 border rounded-md hover:shadow">
                  <div className="font-medium">{alb.name}</div>
                  <div className="text-xs text-gray-500">{alb.images?.length || 0} images</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
