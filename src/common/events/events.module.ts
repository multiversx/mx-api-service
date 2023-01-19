import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';
import { NativeAuthModule } from '../nativeauth/nativeauth.module';

@Module({
  imports: [AuthModule, NativeAuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule { }
