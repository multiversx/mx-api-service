import { Module } from '@nestjs/common';
import { UserDbModule } from '../persistence/userdb/user.db.module';
import { AuthService } from './auth.service';
import { AuthGuardWs } from './auth.guard';
import { ApiModule } from '@elrondnetwork/erdnest';
import { TransactionDbModule } from '../persistence/transactiondb/transactiondb.module';
import { NativeAuthModule } from '../nativeauth/nativeauth.module';

@Module({
  imports: [ApiModule, UserDbModule, TransactionDbModule, NativeAuthModule],
  providers: [AuthService, AuthGuardWs],
  exports: [AuthService, AuthGuardWs],
})
export class AuthModule { }
