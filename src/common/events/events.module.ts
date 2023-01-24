import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';
import { NativeAuthModule } from '../nativeauth/nativeauth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, NativeAuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule { }
