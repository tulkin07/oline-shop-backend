import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GeoService } from './geo.service';

@ApiTags('Geo')
@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Public()
  @Get('regions')
  @ApiOperation({ summary: 'Uzbekistan regions (viloyatlar) for checkout' })
  regions() {
    return this.geo.listRegions();
  }

  @Public()
  @Get('regions/:regionId/districts')
  @ApiOperation({ summary: 'Districts (tumanlar) of a region' })
  districts(@Param('regionId') regionId: string) {
    return this.geo.listDistricts(regionId);
  }

  @Public()
  @Get('regions/:regionId/districts/:districtId/mahallas')
  @ApiOperation({ summary: 'Mahallas of a district (partial data)' })
  mahallas(
    @Param('regionId') regionId: string,
    @Param('districtId') districtId: string,
  ) {
    return this.geo.listMahallas(regionId, districtId);
  }
}
