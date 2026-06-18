import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename');

  if (!fileUrl || !filename) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // ทำความสะอาดเส้นทางไฟล์เพื่อความปลอดภัย
  const cleanUrl = '/' + fileUrl.replace(/^\/+/, '').split('?')[0];
  
  // ป้องกันการดาวน์โหลดไฟล์นอกเหนือจากรูปภาพเอกสารหลักเพื่อความปลอดภัย
  const isAllowedAsset = cleanUrl === '/compulsory_insurance.jpg' || cleanUrl === '/tax_receipt.jpg';
  if (!isAllowedAsset) {
    return new NextResponse('Forbidden asset', { status: 403 });
  }

  try {
    // ดึงไฟล์ผ่าน HTTP โดยใช้ origin ของ request เพื่อให้ใช้ได้ทั้ง localhost และ Vercel Serverless
    const assetUrl = new URL(cleanUrl, request.url).toString();
    const res = await fetch(assetUrl);
    
    if (!res.ok) {
      console.error(`Failed to fetch asset: ${assetUrl}, status: ${res.status}`);
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await res.arrayBuffer();
    const isImage = cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png');

    let responseBuffer: ArrayBuffer | Uint8Array = fileBuffer;
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
      if (cleanUrl.endsWith('.png')) {
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
