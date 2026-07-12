import { Controller, Post, Get, Body, Req, UseGuards, Param, Put, Delete } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(AuthGuard('jwt'))
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new site' })
  async create(@Req() req: any, @Body() createSiteDto: CreateSiteDto) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.createSite(createSiteDto.name, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a site by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a site (owner or admin only)' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteDto
  ) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.updateSite(id, userId, updateSiteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a site (owner only)' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id;
    return this.sitesService.deleteSite(id, userId);
  }
}