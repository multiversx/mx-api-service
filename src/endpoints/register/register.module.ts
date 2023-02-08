import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { AuthModule } from 'src/common/auth/auth.module';
import { RegisterService } from './register.service';

@Module({
  imports: [AuthModule],
  controllers: [RegisterController],
  providers: [RegisterService],
  exports: [RegisterService],
})
export class RegisterModule { }
