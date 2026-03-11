'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
  type Album = { albumId: string; name?: string; images?: Array<number | string>; createdAt?: string; _id?: unknown }
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [moving, setMoving] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImgItem | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{x:number,y:number}|null>(null)
  const lightboxRef = useRef<HTMLDivElement | null>(null)

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
        const data = (await res.json()) as { galleryData?: Record<string, unknown>; albums?: Album[] }
        const galleryData = (data && data.galleryData) || {}
        const albumsResp = data.albums || []
        setAlbums(albumsResp)

        if (albumId === 'all') {
          const all = Object.values(galleryData).flat() as ImgItem[]
          all.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setImages(all)
          return
        }

        const album = albums.find((a) => a.albumId === albumId)
        if (!album) {
          setImages([])
          setAlbumName(null)
          return
        }

        if (album.name) setAlbumName(album.name)
        const ids = new Set((album.images || []).map((i) => String(i)))
        const found: ImgItem[] = []
        Object.values(galleryData).forEach((arr) => {
          const items = (arr as unknown as Array<Record<string, unknown>>) || [];
          items.forEach((it) => {
            const mid = String(it.messageId as number | string | undefined);
            if (ids.has(mid)) {
              found.push(it as unknown as ImgItem)
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

  const openLightbox = (img: ImgItem) => {
    if (selectMode) return
    setCurrentImage(img)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setCurrentImage(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const onWheelZoom = (e: React.WheelEvent) => {
    if (!lightboxOpen) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.max(1, Math.min(4, +(z + delta).toFixed(2))))
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleWheel = (e: WheelEvent) => {
      try {
        if (!lightboxRef.current) return
        if (!lightboxRef.current.contains(e.target as Node)) return
        // prevent browser pinch/ctrl zoom or page scroll when lightbox active
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(z => Math.max(1, Math.min(4, +(z + delta).toFixed(2))))
      } catch (err) {
        console.warn(err)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true } as EventListenerOptions)
    }
  }, [lightboxOpen])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (zoom <= 1) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart) return
    e.preventDefault()
    setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }

  const onMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)
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
      // Try direct fetch first (fast when CORS allows)
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        return;
      }
      // fallthrough to proxy
    } catch (err) {
      console.warn('Direct download failed, falling back to proxy', err);
    }

    try {
      const proxyRes = await fetch('/api/v1/inweb/file-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url, filename }),
      });
      if (!proxyRes.ok) {
        console.error('Proxy download failed', await proxyRes.text().catch(() => ''));
        return;
      }
      const blob = await proxyRes.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error('Download failed (proxy)', err);
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
                // clickable card opens lightbox
                <img onClick={() => openLightbox(img)} src={img.placeholderFileUrl || img.fileUrl || ''} alt={img.caption || ''} className="w-full h-48 object-cover cursor-pointer" loading="lazy" />
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
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={downloadSelected} disabled={selectedIds.size===0}>Download</button>
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
        {lightboxOpen && currentImage && (
          <div ref={lightboxRef} className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center" onWheel={onWheelZoom} style={{ touchAction: 'none' }}>
            <div className="absolute top-4 right-4 text-white space-x-2">
              <button className="px-2 py-1 bg-gray-800 rounded" onClick={()=>setZoom(z=>Math.min(4, +(z+0.25).toFixed(2)))}>+</button>
              <button className="px-2 py-1 bg-gray-800 rounded" onClick={()=>setZoom(z=>Math.max(1, +(z-0.25).toFixed(2)))}>-</button>
              <button className="px-2 py-1 bg-gray-800 rounded" onClick={()=>downloadSingle(currentImage)}>Download</button>
              <button className="px-2 py-1 bg-red-700 rounded" onClick={async ()=>{ // delete
                if (!confirm('Delete this image?')) return;
                const storedKey = localStorage.getItem('apiKey');
                if (!storedKey) return;
                await fetch('/api/v1/inweb/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: storedKey, chatId: albumId === 'all' ? '' : albumId, messageId: currentImage.messageId, mongouri: localStorage.getItem('mongouri')||'', collectionName: localStorage.getItem('mongocollection')||'' }) });
                closeLightbox();
                location.reload();
              }}>Delete</button>
              <button className="px-2 py-1 bg-gray-800 rounded" onClick={closeLightbox}>Close</button>
            </div>
              <div className="relative max-w-4xl max-h-[80vh] overflow-hidden" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
              <img draggable={false} onDragStart={(e)=>e.preventDefault()} src={currentImage.fileUrl || ''} alt={currentImage.caption||''} style={{ transform: `scale(${zoom}) translate(${offset.x/zoom}px, ${offset.y/zoom}px)`, transformOrigin: 'center center', cursor: zoom>1 ? (isPanning ? 'grabbing' : 'grab') : 'auto' }} className="block max-w-full max-h-[80vh]" />
            </div>
            <div className="absolute bottom-6 left-6 text-white">
              <label className="mr-2">Copy to:</label>
              <select className="p-1 rounded text-black" onChange={async (e)=>{
                const aid = e.target.value;
                const storedKey = localStorage.getItem('apiKey');
                if (!storedKey || !aid) return;
                await fetch('/api/v1/inweb/album/modify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: storedKey, albumId: aid, action: 'add', messageId: currentImage.messageId, mongouri: localStorage.getItem('mongouri')||'', collectionName: localStorage.getItem('mongocollection')||'' }) });
                alert('Copied');
              }}>
                <option value="">Select album</option>
                {albums.map(a=> <option key={a.albumId} value={a.albumId}>{a.name||a.albumId}</option>)}
              </select>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
