// ws-validation.pipe.ts
import { Injectable, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new WsException(errors),
      ...options,
    });
  }
}
