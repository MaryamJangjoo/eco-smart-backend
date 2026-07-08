import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SiteRole } from '../../../common/enums/site-role.enum';  
import { AccountingInterceptor } from '../../../common/interceptors/accounting.interceptor';

@ApiTags('Users Profiling')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AccountingInterceptor)
export class UsersController {
  
  @Get('me')
  @Roles(SiteRole.OWNER, SiteRole.ADMIN, SiteRole.EDITOR, SiteRole.VIEWER)  
  async getUserInformation(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    
    return {
      success: true,
      message: 'Security transaction successfully recorded and verified',
      project: 'ECO-SMART',
      data: {
        userId: userId,
        username: req.user.username,
        role: req.user.siteRole || 'VIEWER',  
        scopeInfo: {
          isActive: true,
          permissionGranted: true
        }
      }
    };
  }
}