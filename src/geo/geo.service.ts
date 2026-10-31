import { Injectable, NotFoundException } from '@nestjs/common';
import { UZ_REGIONS } from './uzbekistan-geo.data';

@Injectable()
export class GeoService {
  listRegions() {
    return UZ_REGIONS.map((region) => ({
      id: region.id,
      name: region.name,
      districtsCount: region.districts.length,
    }));
  }

  listDistricts(regionId: string) {
    const region = UZ_REGIONS.find((item) => item.id === regionId);
    if (!region) {
      throw new NotFoundException({
        message: 'Region not found',
        error: 'NOT_FOUND',
      });
    }
    return {
      region: { id: region.id, name: region.name },
      districts: region.districts.map((district) => ({
        id: district.id,
        name: district.name,
        mahallasCount: district.mahallas.length,
      })),
    };
  }

  listMahallas(regionId: string, districtId: string) {
    const region = UZ_REGIONS.find((item) => item.id === regionId);
    if (!region) {
      throw new NotFoundException({
        message: 'Region not found',
        error: 'NOT_FOUND',
      });
    }
    const district = region.districts.find((item) => item.id === districtId);
    if (!district) {
      throw new NotFoundException({
        message: 'District not found',
        error: 'NOT_FOUND',
      });
    }
    return {
      region: { id: region.id, name: region.name },
      district: { id: district.id, name: district.name },
      mahallas: district.mahallas,
    };
  }
}
