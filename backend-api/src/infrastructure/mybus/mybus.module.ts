import { Module, Global } from '@nestjs/common';
import { MyBusSecurityService } from './mybus-security.service';

@Global()
@Module({
  providers: [MyBusSecurityService],
  exports: [MyBusSecurityService],
})
export class MyBusModule {}