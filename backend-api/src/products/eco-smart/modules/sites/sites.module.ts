import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { Site } from './entities/site.entity';
import { SiteMember } from './entities/site-member.entity';
import { User } from '../../../../platform/identity/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, SiteMember, User])
  ],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService, TypeOrmModule], 
})
export class SitesModule {}