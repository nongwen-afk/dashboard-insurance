import { describe, expect, it } from 'vitest';
import {
  extractDateFromString,
  findChassis,
  findLicensePlate,
  findDocNumber,
  findIssuer,
  findDocType,
  parseTextToDocument,
} from './ocrParser';

describe('ocrParser - Dates Extraction', () => {
  it('parses slash date format with BE to CE conversion', () => {
    expect(extractDateFromString('วันหมดอายุ 24/06/2569')).toBe('2026-06-24');
    expect(extractDateFromString('สิ้นสุด 15/12/2026')).toBe('2026-12-15');
    expect(extractDateFromString('01-02-2570')).toBe('2027-02-01');
  });

  it('parses 2-digit slash date format', () => {
    expect(extractDateFromString('วันสิ้นสุดความคุ้มครอง 24/06/69')).toBe('2026-06-24');
    expect(extractDateFromString('expiry 15/12/26')).toBe('2026-12-15');
  });

  it('parses Thai month name formats with BE to CE conversion', () => {
    expect(extractDateFromString('วันหมดอายุ 24 มิถุนายน 2569')).toBe('2026-06-24');
    expect(extractDateFromString('หมดอายุ 24 มิ.ย. 2569')).toBe('2026-06-24');
    expect(extractDateFromString('หมดอายุ 5 ธ.ค. 2570')).toBe('2027-12-05');
  });

  it('parses English month name formats', () => {
    expect(extractDateFromString('Expiry Date: 24 Jun 2026')).toBe('2026-06-24');
    expect(extractDateFromString('Expire 15 December 2027')).toBe('2027-12-15');
  });

  it('parses fuzzy Thai months with OCR spelling errors', () => {
    // Missing หันอากาศ
    expect(extractDateFromString('หมดอายุ 7 กนยายน 2556')).toBe('2013-09-07');
    // Wrong vowel
    expect(extractDateFromString('หมดอายุ 7 ก้นยายน 2556')).toBe('2013-09-07');
    // Abbreviated
    expect(extractDateFromString('หมดอายุ 7 ก.ย. 2556')).toBe('2013-09-07');
  });
});

describe('ocrParser - Chassis / VIN Extraction', () => {
  it('extracts standard 17-character VIN', () => {
    const text = 'หมายเลขตัวถังรถ MRHCN22S001234567 สำหรับตรวจสอบ';
    expect(findChassis(text)).toBe('MRHCN22S001234567');
  });

  it('extracts VIN near keywords and cleans OCR errors', () => {
    const text = 'เลขตัวถัง\nMRHCN22SOO1234567'; // has O instead of 0
    expect(findChassis(text)).toBe('MRHCN22S001234567');
  });

  it('extracts shorter motorcycle chassis numbers', () => {
    const text = 'เลขตัวถัง NS110P0020401';
    expect(findChassis(text)).toBe('NS110P0020401');
  });
});

describe('ocrParser - License Plate Extraction', () => {
  it('extracts commercial plate numbers', () => {
    expect(findLicensePlate('เลขทะเบียนรถ 72-4581 นครปฐม')).toBe('72-4581 นครปฐม');
    expect(findLicensePlate('รถบรรทุก ทะเบียน 80-1234')).toBe('80-1234');
  });

  it('extracts regular Thai plate numbers', () => {
    expect(findLicensePlate('รถยนต์ ทะเบียน 1กข 1234')).toBe('1กข 1234');
    expect(findLicensePlate('ทะเบียนรถ กข 999')).toBe('กข 999');
    expect(findLicensePlate('เลขทะเบียน รร4700 นท')).toBe('รร 4700 นท');
  });
});

describe('ocrParser - Document Number & Issuer & Doc Type', () => {
  it('extracts document numbers', () => {
    expect(findDocNumber('เลขที่กรมธรรม์ 12345/6789-ABC')).toBe('12345/6789-ABC');
    expect(findDocNumber('Policy No. P-1200-999')).toBe('P-1200-999');
  });

  it('extracts common issuers', () => {
    expect(findIssuer('รับประกันภัยโดย บริษัท วิริยะประกันภัย จำกัด (มหาชน)')).toBe('วิริยะประกันภัย');
    expect(findIssuer('บมจ.กรุงเทพประกันภัย')).toBe('กรุงเทพประกันภัย');
    expect(findIssuer('บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด')).toBe('บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด');
    expect(findIssuer('สแกนจาก บมจ.กลางฯ')).toBe('บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด');
  });

  it('extracts document type', () => {
    expect(findDocType('ตารางกรมธรรม์ประกันภัยคุ้มครองผู้ประสบภัยจากรถ')).toBe('act');
    expect(findDocType('เครื่องหมายแสดงการเสียภาษีประจำปี')).toBe('tax');
    expect(findDocType('กรมธรรม์ประกันภัยรถยนต์ประเภท 1')).toBe('insurance');
    expect(findDocType('ใบรับรองการตรวจสภาพรถ ต.ร.о.')).toBe('inspection');
    expect(findDocType('ใบคู่มือจดทะเบียนรถยนต์')).toBe('registration_book');
  });
});

describe('ocrParser - parseTextToDocument', () => {
  it('combines all fields from document text', () => {
    const ocrText = `
      ตารางกรมธรรม์ประกันภัยคุ้มครองผู้ประสบภัยจากรถ (พ.ร.บ.)
      บริษัท วิริยะประกันภัย จำกัด (มหาชน)
      กรมธรรม์เลขที่ 12345/6789-ABC
      เลขตัวถัง: MRHCN22S001234567
      ทะเบียนรถ: 1กข 1234
      เริ่มคุ้มครอง วันที่ 24/06/2568
      สิ้นสุดความคุ้มครอง วันที่ 24 มิ.ย. 2569
    `;
    const result = parseTextToDocument(ocrText);
    expect(result.docType).toBe('act');
    expect(result.issuer).toBe('วิริยะประกันภัย');
    expect(result.docNumber).toBe('12345/6789-ABC');
    expect(result.chassis).toBe('MRHCN22S001234567');
    expect(result.licensePlate).toBe('1กข 1234');
    expect(result.issuedDate).toBe('2025-06-24');
    expect(result.expiryDate).toBe('2026-06-24');
  });

  it('correctly parses fields from the user-provided motorcycle compulsory policy (บริษัทกลางฯ)', () => {
    const userDocText = `
      บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด
      ROAD ACCIDENT VICTIMS PROTECTION COMPANY LIMITED
      ตารางกรมธรรม์ประกันภัยคุ้มครองผู้ประสบภัยจากรถ
      THE SCHEDULE
      กรมธรรม์เลขที่ 8149056264542305
      ชื่อผู้เอาประกันภัย: นางอุไรรัตน์ รอบคอบ
      ระยะเวลาประกันภัย: เริ่มต้นวันที่ 7 กันยายน 2556 สิ้นสุดวันที่ 7 กันยายน 2557
      รายละเอียดรถ:
      เลขทะเบียน รร4700 นท
      เลขตัวถัง NS110P0020401
    `;
    const result = parseTextToDocument(userDocText);
    expect(result.docType).toBe('act');
    expect(result.issuer).toBe('บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด');
    expect(result.docNumber).toBe('8149056264542305');
    expect(result.chassis).toBe('NS110P0020401');
    expect(result.licensePlate).toBe('รร 4700 นท');
    expect(result.issuedDate).toBe('2013-09-07');
    expect(result.expiryDate).toBe('2014-09-07');
  });
});
