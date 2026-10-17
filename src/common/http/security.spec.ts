import type { ServerResponse } from 'http';
import {
  parseCorsOrigin,
  setUploadsHeaders,
  UPLOADS_RESOURCE_POLICY,
} from './security';

describe('parseCorsOrigin', () => {
  it('returns * for undefined, empty or whitespace', () => {
    expect(parseCorsOrigin(undefined)).toBe('*');
    expect(parseCorsOrigin(null)).toBe('*');
    expect(parseCorsOrigin('')).toBe('*');
    expect(parseCorsOrigin('   ')).toBe('*');
  });

  it('returns * when wildcard is present', () => {
    expect(parseCorsOrigin('*')).toBe('*');
    expect(parseCorsOrigin('https://shop.uz,*')).toBe('*');
  });

  it('returns a single origin as a string', () => {
    expect(parseCorsOrigin('https://shop.uz')).toBe('https://shop.uz');
    expect(parseCorsOrigin('  https://shop.uz  ')).toBe('https://shop.uz');
  });

  it('returns multiple origins as a trimmed array', () => {
    expect(
      parseCorsOrigin('https://shop.uz, http://localhost:5173 ,,'),
    ).toEqual(['https://shop.uz', 'http://localhost:5173']);
  });
});

describe('setUploadsHeaders', () => {
  it('sets Cross-Origin-Resource-Policy to cross-origin', () => {
    const setHeader = jest.fn();
    setUploadsHeaders({ setHeader } as unknown as ServerResponse);
    expect(UPLOADS_RESOURCE_POLICY).toBe('cross-origin');
    expect(setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );
  });
});
