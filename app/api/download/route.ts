import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

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
    
    // ตรวจสอบว่าเป็นไฟล์ภาพที่จะแปลงเป็น PDF หรือไม่
    const isImage = filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png');

    let responseBuffer: Buffer | Uint8Array = fileBuffer;
    let contentType = 'application/pdf';
    let outputFilename = filename;

    // ถ้าเป็นรูปภาพ ให้แปลงเป็นไฟล์ PDF
    if (isImage) {
      if (!outputFilename.toLowerCase().endsWith('.pdf')) {
        const lastDotIndex = outputFilename.lastIndexOf('.');
        const baseName = lastDotIndex !== -1 ? outputFilename.substring(0, lastDotIndex) : outputFilename;
        outputFilename = `${baseName}.pdf`;
      }

      // สร้าง PDFDocument ใหม่
      const pdfDoc = await PDFDocument.create();
      
      let embeddedImage;
      if (filePath.endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(fileBuffer);
      } else {
        // สำหรับ .jpg หรือ .jpeg
        embeddedImage = await pdfDoc.embedJpg(fileBuffer);
      }

      // ดึงขนาดดั้งเดิมของรูปภาพ เพื่อให้ขนาดหน้า PDF เท่ารูปดั้งเดิม (ไม่เสียรายละเอียด)
      const { width, height } = embeddedImage;
      const page = pdfDoc.addPage([width, height]);

      // วาดรูปภาพลงในหน้า PDF
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });

      responseBuffer = await pdfDoc.save();
    } else {
      // หากไม่ใช่รูปภาพ ให้ส่งตาม Content-Type ดั้งเดิม
      if (filePath.endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else {
        contentType = 'application/octet-stream';
      }
    }

    // เข้ารหัสชื่อไฟล์เพื่อรองรับอักษรภาษาไทยใน Header Content-Disposition
    const encodedFilename = encodeURIComponent(outputFilename);

    return new NextResponse(new Blob([new Uint8Array(responseBuffer)]), {
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
