import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename');

  if (!fileUrl || !filename) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // ทำความสะอาดเส้นทางไฟล์เพื่อความปลอดภัย ป้องกัน directory traversal
  const cleanUrl = fileUrl.replace(/^\/+/, '').split('?')[0];
  const filePath = path.join(process.cwd(), 'public', cleanUrl);

  // ตรวจสอบว่ามีไฟล์อยู่จริงและอยู่ในโฟลเดอร์ public
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(filePath) || !filePath.startsWith(publicDir)) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // กำหนด Content-Type ตามประเภทไฟล์
    let contentType = 'application/octet-stream';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    // เข้ารหัสชื่อไฟล์เพื่อรองรับอักษรภาษาไทยใน Header Content-Disposition
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
