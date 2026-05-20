import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Try to serve the background image
    const publicDir = path.join(process.cwd(), 'public');
    const imagePaths = [
      { path: path.join(publicDir, 'image.PNG'), contentType: 'image/png' },
      { path: path.join(publicDir, 'healthcare-bg.png'), contentType: 'image/png' },
      { path: path.join(publicDir, 'bg-image.jpg'), contentType: 'image/jpeg' }
    ];
    
    let imageInfo = null;
    for (const info of imagePaths) {
      if (fs.existsSync(info.path)) {
        imageInfo = info;
        break;
      }
    }
    
    if (!imageInfo) {
      return new NextResponse('Background image not found', { status: 404 });
    }
    
    const imageBuffer = fs.readFileSync(imageInfo.path);
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': imageInfo.contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving background image:', error);
    return new NextResponse('Error serving background image', { status: 500 });
  }
}
