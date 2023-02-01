import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { AuthModule } from 'src/common/auth/auth.module';

@Module({
  imports: [PersistenceModule.register(), AuthModule],
  controllers: [RegisterController],
})
export class RegisterModule { }
