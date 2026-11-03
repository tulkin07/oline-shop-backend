import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface GeoMahalla {
  id: string;
  name: string;
}

export interface GeoDistrict {
  id: string;
  name: string;
  mahallas: GeoMahalla[];
}

export interface GeoRegion {
  id: string;
  name: string;
  districts: GeoDistrict[];
}

export const UZ_REGIONS: GeoRegion[] = JSON.parse(
  readFileSync(join(__dirname, 'uzbekistan.json'), 'utf8'),
) as GeoRegion[];
