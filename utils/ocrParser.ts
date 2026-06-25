import type { VehicleDocType, VehicleDocument } from '@/types';

const COMMON_ISSUERS = [
  'บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด', 'บริษัทกลางคุ้มครองผู้ประสบภัยจากรถ', 'บริษัท กลางฯ', 'บริษัทกลาง', 'กลางคุ้มครองผู้ประสบภัย',
  'วิริยะประกันภัย', 'วิริยะ',
  'กรุงเทพประกันภัย', 'กรุงเทพ',
  'สินมั่นคงประกันภัย', 'สินมั่นคง',
  'ทิพยประกันภัย', 'ทิพย',
  'เมืองไทยประกันภัย', 'เมืองไทย',
  'มิตซุย สุมิโตโม', 'มิตซุย',
  'โตเกียวมารีน',
  'แอลเอ็มจี', 'LMG',
  'ธนชาตประกันภัย', 'ธนชาต',
  'เทเวศประกันภัย', 'เทเวศ',
  'อาคเนย์ประกันภัย', 'อาคเนย์',
  'เจมาร์ท ประกันภัย', 'เจมาร์ท',
  'ซมโปะ ประกันภัย', 'ซมโปะ',
  'คุ้มภัยโตเกียวมารีน', 'คุ้มภัย',
  'อินทรประกันภัย', 'อินทร',
  'เอไอจี', 'AIG',
  'ชับบ์สามัคคีประกันภัย', 'ชับบ์', 'Chubb',
  'ไทยวิวัฒน์',
  'MSIG', 'เอ็มเอสไอจี',
  'เออร์โก', 'Ergo',
  'กมลประกันภัย', 'กมล',
  'นำสินประกันภัย', 'นำสิน',
  'ฟอลคอนประกันภัย', 'ฟอลคอน', 'Falcon',
  'อลิอันซ์ อยุธยา', 'อลิอันซ์', 'Allianz',
  'เอเชียประกันภัย', 'เอเชีย', 'ASIA INSURANCE', 'Asia Insurance',
];

/**
 * Fuzzy matches Thai month names to handle OCR typos (e.g., missing vowels or typos).
 */
function matchThaiMonth(str: string): number | null {
  const clean = str.replace(/[\s\.]/g, '').toLowerCase();
  
  if (/มีค/i.test(clean) || /มีน/i.test(clean)) return 3;      // มีนาคม, มี.ค. (Check March first to prevent conflict with Jan)
  if (/ม[^ร]{0,2}ร/i.test(clean) || /มค/i.test(clean)) return 1;  // มกราคม, ม.ค.
  if (/ก[^ม]{0,2}ม/i.test(clean) || /กพ/i.test(clean)) return 2;  // กุมภาพันธ์, ก.พ.
  if (/เม[ษย]?/i.test(clean) || /เมย/i.test(clean)) return 4;  // เมษายน, เม.ย.
  if (/พ[^ษ]{0,2}ษ/i.test(clean) || /พค/i.test(clean)) return 5;     // พฤษภาคม, พ.ค.
  if (/มิ[\.]?ย/i.test(clean) || /ม[^ถย]{0,2}[ถย]/i.test(clean)) return 6; // มิถุนายน, มิ.ย.
  if (/ก[^ก]{0,3}ก/i.test(clean) || /กค/i.test(clean)) return 7;   // กรกฎาคม, ก.ค.
  if (/ส[^ง]{0,2}ง/i.test(clean) || /สค/i.test(clean)) return 8;    // สิงหาคม, ส.ค.
  if (/ก[^น]{0,2}น/i.test(clean) || /กย/i.test(clean)) return 9;    // กันยายน, ก.ย.
  if (/ต[^ล]{0,2}ล/i.test(clean) || /ตค/i.test(clean)) return 10;   // ตุลาคม, ต.ค.
  if (/พ[^ศ]{0,2}ศ/i.test(clean) || /พย/i.test(clean)) return 11;   // พฤศจิกายน, พ.ย.
  if (/ธ[^น]{0,2}น/i.test(clean) || /ธค/i.test(clean)) return 12;   // ธันวาคม, ธ.ค.
  return null;
}

/**
 * Fuzzy matches English month names/abbreviations.
 */
function matchEngMonth(str: string): number | null {
  const clean = str.toLowerCase().trim();
  if (clean.startsWith('jan')) return 1;
  if (clean.startsWith('feb')) return 2;
  if (clean.startsWith('mar')) return 3;
  if (clean.startsWith('apr')) return 4;
  if (clean.startsWith('may')) return 5;
  if (clean.startsWith('jun')) return 6;
  if (clean.startsWith('jul')) return 7;
  if (clean.startsWith('aug')) return 8;
  if (clean.startsWith('sep')) return 9;
  if (clean.startsWith('oct')) return 10;
  if (clean.startsWith('nov')) return 11;
  if (clean.startsWith('dec')) return 12;
  return null;
}

/**
 * Parses dates in various formats (e.g. DD/MM/YYYY, DD-MM-YYYY, DD Month YYYY)
 * and normalizes Thai BE (Buddhist Era) years to Western CE years.
 */
export function extractDateFromString(str: string): string | null {
  if (!str) return null;

  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY
  const slashRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g;
  let match = slashRegex.exec(str);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year > 2400) year -= 543; // Convert BE to CE
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 1900 && year < 2200) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  slashRegex.lastIndex = 0;

  // Pattern 2: DD/MM/YY (2-digit year)
  const slash2Regex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/g;
  match = slash2Regex.exec(str);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year >= 43 && year <= 99) { // 2543 - 2599 => 2000 - 2056
      year = 2500 + year - 543;
    } else if (year >= 0 && year <= 43) { // 2000 - 2043
      year = 2000 + year;
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 1900 && year < 2200) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  slash2Regex.lastIndex = 0;

  // Pattern 3: DD [Month Name] YYYY (e.g. 24 มิ.ย. 2569 or 7 กันยายน 2556)
  const monthNamesRegex = /(\d{1,2})\s+([ก-ฮa-zA-Z\.\u0e00-\u0e7f]+)\s+(\d{4})/g;
  match = monthNamesRegex.exec(str);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    let year = parseInt(match[3], 10);
    if (year > 2400) year -= 543;

    const month = matchThaiMonth(monthStr) || matchEngMonth(monthStr);

    if (month && day >= 1 && day <= 31 && year > 1900 && year < 2200) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  monthNamesRegex.lastIndex = 0;

  return null;
}

export function findDateNearKeywords(text: string, keywords: string[]): string | null {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find the keyword that matches
    let matchedKeyword = '';
    for (const k of keywords) {
      if (line.toLowerCase().includes(k.toLowerCase())) {
        matchedKeyword = k;
        break;
      }
    }

    if (matchedKeyword) {
      // Slice the line starting from the keyword to avoid parsing previous dates on the same line
      const keywordIndex = line.toLowerCase().indexOf(matchedKeyword.toLowerCase());
      const slicedLine = line.substring(keywordIndex);

      let date = extractDateFromString(slicedLine);
      if (date) return date;

      // Check next line
      if (i + 1 < lines.length) {
        date = extractDateFromString(lines[i + 1]);
        if (date) return date;
      }

      // Check previous line
      if (i - 1 >= 0) {
        date = extractDateFromString(lines[i - 1]);
        if (date) return date;
      }
    }
  }
  return null;
}

export function findChassis(text: string): string | null {
  // 1. Direct standard 17-char VIN
  const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;
  let match;
  while ((match = vinRegex.exec(text)) !== null) {
    const vin = match[1].toUpperCase();
    const hasDigits = /[0-9]/.test(vin);
    const hasLetters = /[A-Z]/.test(vin);
    if (hasDigits && hasLetters) {
      return vin;
    }
  }
  vinRegex.lastIndex = 0;

  // 2. Near chassis keywords
  const lines = text.split('\n');
  const keywords = ['เลขตัวถัง', 'ตัวถัง', 'chassis', 'vin', 'หมายเลขตัวรถ', 'เลขตัวรถ', 'เลขตังถัง', 'เลขถัง'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasKeyword = keywords.some(k => line.toLowerCase().includes(k));
    if (hasKeyword) {
      // Find any alphanumeric string of length 9-20 in previous, current, or next line
      const surroundingText = (lines[i - 1] || '') + ' ' + line + ' ' + (lines[i + 1] || '');
      const cleanLine = surroundingText.replace(/[^A-Za-z0-9]/g, ' ');
      const words = cleanLine.split(/\s+/);
      for (const word of words) {
        if (word.length >= 9 && word.length <= 20) {
          const vin = word.toUpperCase();
          if (/[A-Z]/.test(vin) && /[0-9]/.test(vin)) {
            // Clean common OCR digit substitution errors
            return vin.replace(/O/g, '0').replace(/I/g, '1');
          }
        }
      }
    }
  }

  // 3. Fallback to any 9-20 char word with mixed alphanumeric characters (like NS110P0020401)
  const fallbackVinRegex = /\b([A-Z0-9]{9,20})\b/gi;
  while ((match = fallbackVinRegex.exec(text)) !== null) {
    const vin = match[1].toUpperCase();
    const hasDigits = /[0-9]/.test(vin);
    const hasLetters = /[A-Z]/.test(vin);
    if (hasDigits && hasLetters) {
      return vin.replace(/O/g, '0').replace(/I/g, '1');
    }
  }
  fallbackVinRegex.lastIndex = 0;

  return null;
}

export function findLicensePlate(text: string): string | null {
  // 1. Commercial plate pattern: 7X-XXXX or 8X-XXXX
  const commRegex = /\b((?:7\d|8\d)-\d{4})(?:\s+([ก-ฮะ-์]{2,}))?/;
  const commMatch = commRegex.exec(text);
  if (commMatch) {
    return commMatch[1] + (commMatch[2] ? ` ${commMatch[2]}` : '');
  }

  // 2. Regular plate pattern (e.g. 1กข 1234 or กข 1234)
  // Use negative lookbehind (?<![\u0e00-\u0e7f]) so we don't match the suffix of words like "ทะเบียนรถ"
  const regularRegex = /(?<![\u0e00-\u0e7f])([1-9]?[\u0e01-\u0e2e]{2})\s*[-]?\s*(\d{1,4})(?:\s+([ก-ฮะ-์]{2,}))?/g;
  const match = regularRegex.exec(text);
  if (match) {
    return `${match[1]} ${match[2]}` + (match[3] ? ` ${match[3]}` : '');
  }
  regularRegex.lastIndex = 0;

  // 3. Near license keywords fallback
  const lines = text.split('\n');
  const keywords = ['ทะเบียน', 'เลขทะเบียน', 'license', 'plate', 'เลขทะเบียนรถ', 'เลขทะเบียน/จังหวัด', 'เลขทะเบียนรถยนต์'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasKeyword = keywords.some(k => line.toLowerCase().includes(k));
    if (hasKeyword) {
      const lineText = line + ' ' + (lines[i + 1] || '');
      // Clean up common keyword terms to prevent false positives matching letters inside words like "ทะเบียนรถ"
      const cleanLineText = lineText.replace(/ทะเบียน|เลขทะเบียน|รถ|จังหวัด/g, ' ');
      
      const numRegex = /\b(\d{1,4})\b/g;
      const numbers = [...cleanLineText.matchAll(numRegex)].map(m => m[1]);
      
      const thaiLettersRegex = /([\u0e01-\u0e2e]{1,2})/g;
      const lettersMatch = thaiLettersRegex.exec(cleanLineText);
      if (lettersMatch && numbers.length > 0) {
        return `${lettersMatch[1]} ${numbers[0]}`;
      }
    }
  }

  return null;
}

export function findDocNumber(text: string): string | null {
  const lines = text.split('\n');
  const keywords = ['เลขที่', 'policy', 'กรมธรรม์เลขที่', 'เลขที่ใบเสร็จ', 'เลขที่เอกสาร', 'เลขที่คำขอ', 'ใบเสร็จรับเงินเลขที่', 'ตารางกรมธรรม์เลขที่'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasKeyword = keywords.some(k => line.toLowerCase().includes(k));
    if (hasKeyword) {
      // Remove keywords
      const restOfLine = line.replace(new RegExp(keywords.join('|'), 'gi'), '');
      const docNumRegex = /\b([a-zA-Z0-9\-\/]{5,25})\b/g;
      const matches = [...restOfLine.matchAll(docNumRegex)].map(m => m[1]);
      for (const m of matches) {
        if (/\d/.test(m) && m.length >= 6) {
          return m;
        }
      }
    }
  }
  return null;
}

export function findIssuer(text: string): string | null {
  if (/กลางฯ|กลางคุ้มครอง|บริษัท\s*กลาง|บมจ[\s\.]*กลาง/i.test(text)) {
    return 'บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด';
  }
  
  for (const issuer of COMMON_ISSUERS) {
    if (text.toLowerCase().includes(issuer.toLowerCase())) {
      if (issuer === 'วิริยะ') return 'วิริยะประกันภัย';
      if (issuer === 'กรุงเทพ') return 'กรุงเทพประกันภัย';
      if (issuer === 'สินมั่นคง') return 'สินมั่นคงประกันภัย';
      if (issuer === 'ทิพย') return 'ทิพยประกันภัย';
      if (issuer === 'เมืองไทย') return 'เมืองไทยประกันภัย';
      if (issuer === 'ธนชาต') return 'ธนชาตประกันภัย';
      if (issuer === 'เทเวศ') return 'เทเวศประกันภัย';
      if (issuer === 'อาคเนย์') return 'อาคเนย์ประกันภัย';
      if (issuer === 'คุ้มภัย') return 'คุ้มภัยโตเกียวมารีน';
      if (issuer === 'อินทร') return 'อินทรประกันภัย';
      if (issuer === 'ชับบ์') return 'ชับบ์สามัคคีประกันภัย';
      if (issuer === 'อลิอันซ์') return 'อลิอันซ์ อยุธยา';
      return issuer;
    }
  }
  return null;
}

export function findDocType(text: string): VehicleDocType | null {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('ต.ร.อ.') || lowerText.includes('ตรวจสภาพ') || lowerText.includes('สถานตรวจสภาพรถ')) {
    return 'inspection';
  }
  if (
    lowerText.includes('ผู้ประสบภัยจากรถ') ||
    lowerText.includes('พ.ร.บ.') ||
    lowerText.includes('พ.ร.บ') ||
    lowerText.includes('คุ้มครองผู้ประสบภัย')
  ) {
    return 'act';
  }
  if (
    lowerText.includes('เสียภาษี') ||
    lowerText.includes('เครื่องหมายแสดงการเสียภาษี') ||
    lowerText.includes('ภาษีประจำปี') ||
    lowerText.includes('ตารางแสดงรายการเสียภาษี')
  ) {
    return 'tax';
  }
  if (
    lowerText.includes('ประกันภัยรถยนต์') ||
    lowerText.includes('สมัครใจ') ||
    lowerText.includes('ประเภท 1') ||
    lowerText.includes('ประเภท 3') ||
    lowerText.includes('กรมธรรม์ประกันภัย')
  ) {
    return 'insurance';
  }
  if (
    lowerText.includes('คู่มือจดทะเบียน') ||
    lowerText.includes('รายการจดทะเบียน') ||
    lowerText.includes('จดทะเบียนรถ')
  ) {
    return 'registration_book';
  }
  return null;
}

export function parseTextToDocument(text: string): Partial<VehicleDocument> {
  const chassis = findChassis(text) || undefined;
  const licensePlate = findLicensePlate(text) || undefined;
  const docType = findDocType(text) || undefined;
  const docNumber = findDocNumber(text) || undefined;
  const issuer = findIssuer(text) || undefined;

  let expiryDate = findDateNearKeywords(text, ['หมดอายุ', 'สิ้นสุด', 'expiry', 'expire', 'จนถึงวันที่', 'สิ้นสุดความคุ้มครอง', 'ถึงวันที่']) || undefined;
  let issuedDate = findDateNearKeywords(text, ['เริ่มมีผล', 'เริ่มคุ้มครอง', 'วันเริ่ม', 'ตั้งแต่วันที่', 'issued', 'effective', 'เริ่มต้นวันที่']) || undefined;

  // Chronological fallback if keywords fail but we found dates in the document
  if (!expiryDate || !issuedDate) {
    const allDates: string[] = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const date = extractDateFromString(line);
      if (date && !allDates.includes(date)) {
        allDates.push(date);
      }
    }
    
    // Sort dates ascending
    allDates.sort();

    if (allDates.length >= 2) {
      if (allDates.length === 2) {
        if (!issuedDate) issuedDate = allDates[0];
        if (!expiryDate) expiryDate = allDates[1];
      } else if (allDates.length === 3) {
        // Typically: [ContractDate, StartDate, ExpiryDate]
        if (!issuedDate) issuedDate = allDates[1];
        if (!expiryDate) expiryDate = allDates[2];
      }
    } else if (allDates.length === 1) {
      if (!expiryDate) expiryDate = allDates[0];
    }
  }

  return {
    chassis,
    licensePlate,
    docType,
    docNumber,
    issuer,
    expiryDate,
    issuedDate
  };
}
