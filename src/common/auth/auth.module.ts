import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuardWs } from './auth.guard.ws';
import { ApiModule } from '@multiversx/sdk-nestjs';
import { NativeAuthModule } from '../nativeauth/nativeauth.module';

@Module({
  imports: [ApiModule, NativeAuthModule],
  providers: [AuthService, AuthGuardWs],
  exports: [AuthService, AuthGuardWs],
})
export class AuthModule { }
