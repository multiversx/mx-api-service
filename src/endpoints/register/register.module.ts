import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { UserDbModule } from 'src/common/persistence/userdb/user.db.module';
import { AuthModule } from 'src/common/auth/auth.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.register(), UserDbModule, AuthModule],
  controllers: [RegisterController],
})
export class RegisterModule { }
