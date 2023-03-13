import { Module } from '@nestjs/common';
import { NativeAuthService } from './nativeauth.service';

@Module({
    providers: [NativeAuthService],
    exports: [NativeAuthService],
})
export class NativeAuthModule { }
