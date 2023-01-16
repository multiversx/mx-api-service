import {
  PipeTransform,
  ArgumentMetadata,
  Injectable,
  UseFilters,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

import { SubscriptionEntry } from './events.types';

@UseFilters(new BaseWsExceptionFilter())
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new WsException('No value provided');
    }

    if (metadata.type === 'body' && value instanceof Array<SubscriptionEntry>) {
      if (value.length === 0) {
        throw new WsException(
          'Invalid subscription entry array. Cannot be empty.',
        );
      }

      for (const entry of value) {
        const keys = Object.keys(entry);
        if (!keys.includes('address') && !keys.includes('identifier')) {
          throw new WsException('Invalid subscription entry');
        }
      }
    } else if (metadata.type === 'body') {
      throw new WsException(`Invalid body type!`);
    }

    return value;
  }

  toValidate(value: any) {
    return value;
  }
}
