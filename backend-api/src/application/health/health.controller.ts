import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  
  @Get()
  @ApiOperation({ summary: 'Check server health status' })
  checkHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}