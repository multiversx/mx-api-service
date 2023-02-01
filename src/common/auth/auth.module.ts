import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuardWs } from './auth.guard';
import { ApiModule } from '@elrondnetwork/erdnest';
import { NativeAuthModule } from '../nativeauth/nativeauth.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [ApiModule, PersistenceModule.register(), NativeAuthModule],
  providers: [AuthService, AuthGuardWs],
  exports: [AuthService, AuthGuardWs],
})
export class AuthModule { }
