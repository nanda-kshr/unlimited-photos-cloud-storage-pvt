import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileUrl, filename } = body as { fileUrl?: string; filename?: string };
    if (!fileUrl) {
      return NextResponse.json({ message: 'fileUrl is required' }, { status: 400 });
    }

    // Basic validation: only allow Telegram file URLs to be proxied
    if (!fileUrl.startsWith('https://api.telegram.org/file/bot')) {
      return NextResponse.json({ message: 'Invalid file URL' }, { status: 400 });
    }

    const resp = await fetch(fileUrl);
    if (!resp.ok) {
      return NextResponse.json({ message: 'Failed to fetch remote file' }, { status: 502 });
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (filename) {
      headers['Content-Disposition'] = `attachment; filename="${filename.replace(/"/g, '')}"`;
    }

    return new NextResponse(buffer, { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('File proxy error:', msg);
    return NextResponse.json({ message: 'Proxy failed', error: msg }, { status: 500 });
  }
}
