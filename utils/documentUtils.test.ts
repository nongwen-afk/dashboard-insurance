import { describe, expect, it, vi } from 'vitest';
import {
  formatDateOnly,
  formatThaiDate,
  getCleanLicensePlate,
  getDocumentRecordKey,
  getDocumentStatus,
  getRenewedDocumentDates,
  isSameDocumentRecord,
  parseDocumentDate,
} from './documentUtils';
import type { VehicleDocument } from '@/types';

describe('documentUtils', () => {
  it('parses valid date-only strings and rejects invalid calendar dates', () => {
    expect(formatDateOnly(parseDocumentDate('2026-06-23')!)).toBe('2026-06-23');
    expect(parseDocumentDate('2026-02-30')).toBeNull();
    expect(parseDocumentDate('not-a-date')).toBeNull();
  });

  it('formats Thai dates without hiding invalid source values', () => {
    expect(formatThaiDate('2026-06-23')).toBe('23 มิ.ย. 2569');
    expect(formatThaiDate('bad-date')).toBe('bad-date');
    expect(formatThaiDate()).toBe('-');
  });

  it('classifies expiry status against the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T10:00:00+07:00'));

    expect(getDocumentStatus('2026-06-22')).toEqual({ status: 'EXPIRED', days: -1 });
    expect(getDocumentStatus('2026-07-23')).toEqual({ status: 'WARNING', days: 30 });
    expect(getDocumentStatus('2026-07-24')).toEqual({ status: 'ACTIVE', days: 31 });
    expect(getDocumentStatus()).toEqual({ status: 'NO_EXPIRY', days: 0 });

    vi.useRealTimers();
  });

  it('renews documents by carrying the current expiry date forward one year', () => {
    expect(getRenewedDocumentDates('2026-06-23')).toEqual({
      issuedDate: '2026-06-23',
      expiryDate: '2027-06-23',
    });
  });

  it('uses stable ids for record identity and falls back to document fields', () => {
    const baseDoc: VehicleDocument = {
      id: 'doc-1',
      chassis: 'CHAS-001',
      docType: 'tax',
      docNumber: 'TAX-1',
      issuedDate: '2026-01-01',
      expiryDate: '2027-01-01',
    };
    const changedSameId = { ...baseDoc, expiryDate: '2030-01-01' };
    const noId = { ...baseDoc, id: undefined };

    expect(getDocumentRecordKey(baseDoc)).toBe('doc-1');
    expect(isSameDocumentRecord(baseDoc, changedSameId)).toBe(true);
    expect(getDocumentRecordKey(noId)).toBe('CHAS-001|tax|TAX-1|2026-01-01|2027-01-01');
  });

  it('removes trailing province text from license plates', () => {
    expect(getCleanLicensePlate('1กก 1234 กรุงเทพ')).toBe('1กก 1234');
    expect(getCleanLicensePlate('EVT-001')).toBe('EVT-001');
    expect(getCleanLicensePlate()).toBe('');
  });
});
