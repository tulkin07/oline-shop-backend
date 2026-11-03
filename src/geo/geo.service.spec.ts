import { GeoService } from './geo.service';

describe('GeoService', () => {
  const geo = new GeoService();

  it('lists 14 Uzbekistan regions', () => {
    expect(geo.listRegions()).toHaveLength(14);
  });

  it('returns mahallas for Yunusobod, Toshkent shahri', () => {
    const result = geo.listMahallas('toshkent-shahri', 'yunusobod-tumani');
    expect(result.mahallas.length).toBeGreaterThan(20);
    expect(result.mahallas.some((m) => m.name === 'Bogishamol')).toBe(true);
  });
});
