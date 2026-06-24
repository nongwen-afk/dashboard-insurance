import * as XLSX from 'xlsx';
import { describe, expect, it, vi } from 'vitest';
import { parseVehicleDocumentsFromFile } from './importVehicleDocuments';

const makeWorkbookFile = (rows: unknown[][], name = 'vehicles.xlsx') => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Documents');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new File([buffer], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

describe('parseVehicleDocumentsFromFile', () => {
  it('detects headers and normalizes Thai document data', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1782175529000);

    const file = makeWorkbookFile([
      ['ทะเบียนรถ', 'เลขตัวถัง', 'ประเภทเอกสาร', 'วันหมดอายุ', 'วันที่มีผล', 'บริษัทประกัน', 'เลขที่กรมธรรม์', 'ผู้รับผิดชอบ', 'หมายเหตุ', 'โครงการ'],
      ['1กก 1234 กรุงเทพ', 'CHAS-001', 'พ.ร.บ.', '23/06/2569', '23/06/2568', 'ทดสอบประกัน', 'POL-001', 'สมชาย', 'ต่ออายุแล้ว', 'EVT'],
    ]);

    const docs = await parseVehicleDocumentsFromFile(file);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      id: 'import-vehicles.xlsx-1782175529000-1',
      chassis: 'CHAS-001',
      licensePlate: '1กก 1234 กรุงเทพ',
      project: 'EVT',
      docType: 'act',
      issuer: 'ทดสอบประกัน',
      docNumber: 'POL-001',
      issuedDate: '2025-06-23',
      expiryDate: '2026-06-23',
      driverName: 'สมชาย',
      note: 'ต่ออายุแล้ว',
    });

    vi.restoreAllMocks();
  });

  it('falls back to the standard column order when headers are absent', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1782175529000);

    const file = makeWorkbookFile([
      ['CHAS-002', '2ขข 5678 เชียงใหม่', 'EVT', 'insurance', 'บริษัท A', 'INS-002', '2026-01-01', '2027-01-01', '', ''],
      ['', 'missing chassis should be skipped'],
    ], 'fallback.xlsx');

    const docs = await parseVehicleDocumentsFromFile(file);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      id: 'import-fallback.xlsx-1782175529000-0',
      chassis: 'CHAS-002',
      licensePlate: '2ขข 5678 เชียงใหม่',
      project: 'EVT',
      docType: 'insurance',
      issuer: 'บริษัท A',
      docNumber: 'INS-002',
      issuedDate: '2026-01-01',
      expiryDate: '2027-01-01',
      driverName: undefined,
      note: undefined,
    });

    vi.restoreAllMocks();
  });
});
