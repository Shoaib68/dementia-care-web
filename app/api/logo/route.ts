import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Try multiple logo paths in priority order
    const publicDir = path.join(process.cwd(), 'public');
    const logoPaths = [
      { path: path.join(publicDir, 'logonew.png'), contentType: 'image/png' },
      { path: path.join(publicDir, 'logo.jpg'), contentType: 'image/jpeg' },
      { path: path.join(publicDir, 'images', 'logo', 'dementialogo.jpg'), contentType: 'image/jpeg' }
    ];
    
    let logoInfo = null;
    for (const info of logoPaths) {
      if (fs.existsSync(info.path)) {
        logoInfo = info;
        break;
      }
    }
    
    if (!logoInfo) {
      return new NextResponse('Logo not found', { status: 404 });
    }
    
    const logoBuffer = fs.readFileSync(logoInfo.path);
    
    return new NextResponse(logoBuffer, {
      status: 200,
      headers: {
        'Content-Type': logoInfo.contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': logoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    return new NextResponse('Error serving logo', { status: 500 });
  }
}
