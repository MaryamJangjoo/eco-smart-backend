import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client (organization) owned by the current user' })
  async create(@Req() req: any, @Body() dto: CreateClientDto) {
    const ownerId = req.user.sub || req.user.id;
    return this.clientsService.createClient(dto.name, ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'List clients owned by the current user' })
  async findAll(@Req() req: any) {
    const ownerId = req.user.sub || req.user.id;
    return this.clientsService.findAllForUser(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single client owned by the current user' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub || req.user.id;
    return this.clientsService.findByIdForUser(id, ownerId);
  }
}