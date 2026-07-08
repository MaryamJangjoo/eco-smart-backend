import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { ShareSiteDto } from './dto/share-site.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(AuthGuard('jwt'))
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  async create(@Req() req: any, @Body() createSiteDto: CreateSiteDto) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.createSite(createSiteDto.name, createSiteDto.clientId, userId);
  }

  @Post('share')
  async share(@Req() req: any, @Body() shareSiteDto: ShareSiteDto) {
    const ownerId = req.user.sub || req.user.id;
    return this.sitesService.addMember(ownerId, shareSiteDto.siteId, shareSiteDto.email);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.findAllForUser(userId);
  }
}