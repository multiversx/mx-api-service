import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { AuthModule } from 'src/common/auth/auth.module';
import { RegisterService } from './register.service';

@Module({
  imports: [PersistenceModule.forRoot(), AuthModule],
  providers: [RegisterService],
  controllers: [RegisterController],
  exports: [RegisterService],
})
export class RegisterModule { }
