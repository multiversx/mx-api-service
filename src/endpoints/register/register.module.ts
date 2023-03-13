import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { AuthModule } from 'src/common/auth/auth.module';
import { RegisterService } from './register.service';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';

@Module({
  imports: [AuthModule],
  controllers: [RegisterController],
  providers: [
    RegisterService,
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  exports: [RegisterService],
})
export class RegisterModule { }
