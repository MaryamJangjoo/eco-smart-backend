import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { ShareSiteDto } from './dto/share-site.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Sites') 
@ApiBearerAuth()  
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() createSiteDto: CreateSiteDto) {
    const userId = req.user.id;
    return this.sitesService.createSite(createSiteDto.name, userId);
  }

  @Post('share')
  @UseGuards(AuthGuard('jwt'))
  async share(@Req() req: any, @Body() shareSiteDto: ShareSiteDto) {
    const ownerId = req.user.id;
    return this.sitesService.addMember(ownerId, shareSiteDto.siteId, shareSiteDto.email);
  }
}