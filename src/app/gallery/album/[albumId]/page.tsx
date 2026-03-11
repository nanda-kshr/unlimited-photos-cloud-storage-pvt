'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface ImgItem {
  messageId: number
  timestamp: string
  caption?: string
  fileUrl?: string | null
  placeholderFileUrl?: string | null
}

export default function AlbumPageClient() {
  const params = useParams() as { albumId?: string }
  const router = useRouter()
  const albumId = params?.albumId || 'all'

  const [isFetching, setIsFetching] = useState(false)
  const [images, setImages] = useState<ImgItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [albumName, setAlbumName] = useState<string | null>(null)
  const [albums, setAlbums] = useState<any[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [moving, setMoving] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)

  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey')
    if (!storedKey) {
      setError('API Key missing')
      return
    }

    const fetchData = async () => {
      try {
        setIsFetching(true)
        const res = await fetch('/api/v1/inweb/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: storedKey, userId: storedKey, mongouri: localStorage.getItem('mongouri') || '', collectionName: localStorage.getItem('mongocollection') || '' }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        const galleryData = data.galleryData || {}
        const albums = data.albums || []
        setAlbums(albums)

        if (albumId === 'all') {
          const all = Object.values(galleryData).flat() as ImgItem[]
          all.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setImages(all)
          return
        }

        const album = albums.find((a: any) => a.albumId === albumId)
        if (!album) {
          setImages([])
          setAlbumName(null)
          return
        }

        setAlbumName(album.name)
        const ids = new Set((album.images || []).map((i: any) => String(i)))
        const found: ImgItem[] = []
        Object.values(galleryData).forEach((arr: any) => {
          (arr || []).forEach((it: any) => {
            if (ids.has(String(it.messageId))) {
              found.push(it)
            }
          })
        })
        found.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setImages(found)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [albumId])

  const toggleSelect = (id: string | number) => {
    const sid = String(id)
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const performRemove = async () => {
    const storedKey = localStorage.getItem('apiKey')
    if (!storedKey) return
    const ids = Array.from(selectedIds).map(s => Number(s))
    try {
      setIsFetching(true)
      await fetch('/api/v1/inweb/album/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: storedKey,
          albumId,
          action: 'remove',
          messageIds: ids,
          mongouri: localStorage.getItem('mongouri') || '',
          collectionName: localStorage.getItem('mongocollection') || ''
        }),
      })
      // refresh
      clearSelection()
      location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetching(false)
    }
  }

  const performMove = async () => {
    const storedKey = localStorage.getItem('apiKey')
    if (!storedKey || !moveTarget) return
    const ids = Array.from(selectedIds).map(s => Number(s))
    try {
      setIsFetching(true)
      // add to target album first
      await fetch('/api/v1/inweb/album/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: storedKey,
          albumId: moveTarget,
          action: 'add',
          messageIds: ids,
          mongouri: localStorage.getItem('mongouri') || '',
          collectionName: localStorage.getItem('mongocollection') || ''
        }),
      })
      // remove from current
      await fetch('/api/v1/inweb/album/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: storedKey,
          albumId,
          action: 'remove',
          messageIds: ids,
          mongouri: localStorage.getItem('mongouri') || '',
          collectionName: localStorage.getItem('mongocollection') || ''
        }),
      })
      clearSelection()
      setMoving(false)
      location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetching(false)
    }
  }

  const downloadBlobFromUrl = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error('Download failed', err);
    }
  }

  const downloadSingle = async (img: ImgItem) => {
    if (!img.fileUrl) return
    const fname = `img_${img.messageId}.jpg`
    await downloadBlobFromUrl(img.fileUrl, fname)
  }

  const downloadSelected = async () => {
    const sel = Array.from(selectedIds)
    const selectedImgs = images.filter(i => sel.includes(String(i.messageId)))
    for (const img of selectedImgs) {
      if (img.fileUrl) await downloadBlobFromUrl(img.fileUrl, `img_${img.messageId}.jpg`)
    }
  }

  const downloadAll = async () => {
    for (const img of images) {
      if (img.fileUrl) await downloadBlobFromUrl(img.fileUrl, `img_${img.messageId}.jpg`)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => router.push('/gallery')} className="px-3 py-1 bg-white border rounded">← Back to albums</button>
        <h2 className="text-lg font-medium">{`Album: ${albumName || albumId}`}</h2>
        <div className="ml-auto relative">
          <button aria-label="menu" onClick={() => setMenuOpen(s => !s)} className="px-2 py-1 rounded hover:bg-gray-100">⋯</button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow p-2 z-20">
              <button className="w-full text-left px-2 py-1 hover:bg-gray-50" onClick={() => { setSelectMode(true); setMenuOpen(false) }}>Select files</button>
              <button className="w-full text-left px-2 py-1 hover:bg-gray-50" onClick={() => { downloadAll(); setMenuOpen(false) }}>Download all</button>
              <button className="w-full text-left px-2 py-1 hover:bg-gray-50" onClick={() => { navigator.clipboard?.writeText(albumId); setMenuOpen(false) }}>Copy album id</button>
            </div>
          )}
        </div>
      </div>

      {isFetching ? (
        <div className="text-center text-gray-500 p-6">Loading images…</div>
      ) : error ? (
        <div className="text-center text-red-500 p-6">{error}</div>
      ) : images.length === 0 ? (
        <div className="text-center text-gray-500 p-6">No images found in this album.</div>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.messageId} className="border rounded overflow-hidden relative">
              {selectMode && (
                <label className="absolute top-2 left-2 z-30 bg-white rounded-full p-1 shadow">
                  <input type="checkbox" checked={selectedIds.has(String(img.messageId))} onChange={() => toggleSelect(img.messageId)} />
                </label>
              )}
              <button onClick={() => downloadSingle(img)} className="absolute top-2 right-2 z-30 bg-white rounded-full p-1 shadow">
                ⤓
              </button>
              {img.fileUrl ? (
                // use plain img for simplicity
                <img src={img.placeholderFileUrl || img.fileUrl || ''} alt={img.caption || ''} className="w-full h-48 object-cover" loading="lazy" />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">Image not available</div>
              )}
              <div className="p-2 text-xs text-gray-600">{new Date(img.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {selectMode && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded shadow p-3 flex items-center gap-3 z-40">
            <div>{selectedIds.size} selected</div>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={performRemove} disabled={selectedIds.size===0}>Remove</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setMoving(true)} disabled={selectedIds.size===0}>Move</button>
            <button className="px-3 py-1 border rounded" onClick={clearSelection}>Cancel</button>
          </div>
        
        )}

        {moving && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="mb-2 font-medium">Move to album</h3>
              <select className="mb-3 p-2 border rounded w-full" value={moveTarget||''} onChange={(e)=>setMoveTarget(e.target.value)}>
                <option value="">Select album</option>
                {albums.filter(a=>a.albumId!==albumId).map(a=> (
                  <option key={a.albumId} value={a.albumId}>{a.name || a.albumId}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button className="px-3 py-1 border rounded" onClick={()=>setMoving(false)}>Cancel</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={performMove} disabled={!moveTarget}>Move</button>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
