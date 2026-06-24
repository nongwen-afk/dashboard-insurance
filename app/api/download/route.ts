import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { compulsoryInsuranceBase64, taxReceiptBase64 } from '@/utils/documentBase64';
import { captureHandledError } from '@/utils/sentry';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename');

  if (!fileUrl || !filename) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // ทำความสะอาดเส้นทางไฟล์
  const cleanUrl = '/' + fileUrl.replace(/^\/+/, '').split('?')[0];

  // จับคู่ไฟล์หลักและโหลดข้อมูลจาก Base64 ที่คอมไพล์รวมไว้ในโค้ด
  let base64Data = '';
  if (cleanUrl === '/compulsory_insurance.jpg') {
    base64Data = compulsoryInsuranceBase64;
  } else if (cleanUrl === '/tax_receipt.jpg') {
    base64Data = taxReceiptBase64;
  }

  if (!base64Data) {
    return new NextResponse('Forbidden or not found asset', { status: 403 });
  }

  try {
    // แปลงข้อมูล Base64 เป็น ArrayBuffer/Buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');
    let outputFilename = filename;

    // บังคับให้ชื่อไฟล์ลงท้ายด้วย .pdf
    if (!outputFilename.toLowerCase().endsWith('.pdf')) {
      const lastDotIndex = outputFilename.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? outputFilename.substring(0, lastDotIndex) : outputFilename;
      outputFilename = `${baseName}.pdf`;
    }

    // สร้างไฟล์ PDF โดยใช้ pdf-lib วาดรูปภาพลงในหน้าใหม่แบบ 1:1
    const pdfDoc = await PDFDocument.create();
    const embeddedImage = await pdfDoc.embedJpg(fileBuffer);
    const { width, height } = embeddedImage;
    
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    const encodedFilename = encodeURIComponent(outputFilename);

    return new NextResponse(new Blob([new Uint8Array(pdfBytes)]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    captureHandledError(error, {
      operation: 'document.download',
      route: '/api/download',
    });

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
