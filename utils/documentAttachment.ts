import type { VehicleDocType, VehicleDocument } from '@/types';

export type DocumentAttachmentPreview = {
  src: string;
  title: string;
  alt: string;
  width: number;
  height: number;
};

const attachmentByType: Partial<Record<VehicleDocType, DocumentAttachmentPreview>> = {
  act: {
    src: '/compulsory_insurance.jpg',
    title: 'เอกสาร พ.ร.บ.',
    alt: 'ตัวอย่างเอกสารกรมธรรม์ประกันภัยรถยนต์ภาคบังคับ',
    width: 768,
    height: 1049,
  },
  tax: {
    src: '/tax_receipt.jpg',
    title: 'ป้ายภาษีรถยนต์',
    alt: 'ตัวอย่างป้ายแสดงการเสียภาษีรถยนต์',
    width: 738,
    height: 700,
  },
};

export const getDocumentAttachmentPreview = (
  document: VehicleDocument,
): DocumentAttachmentPreview | null => {
  if (!document.hasAttachment) return null;
  return attachmentByType[document.docType] || null;
};
