import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { AccountingInterceptor } from '../../../common/interceptors/accounting.interceptor';

@ApiTags('Users Profiling')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AccountingInterceptor)
export class UsersController {
  
  @Get('me')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.OPERATOR)
  async getUserInformation(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    
    return {
      success: true,
      message: 'Security transaction successfully recorded and verified',
      project: 'ECO-SMART',
      data: {
        userId: userId,
        username: req.user.username,
        role: req.user.role,
        scopeInfo: {
          isActive: true,
          permissionGranted: true
        }
      }
    };
  }
}