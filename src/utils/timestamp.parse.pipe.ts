import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { TimeUtils } from './time.utils';

@Injectable()
export class TimestampParsePipe implements PipeTransform {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  transform(value: any): number | undefined {
    if (value === undefined || value === null) return undefined;

    const valNumber = parseInt(value, 10);
    if (isNaN(valNumber)) {
      throw new BadRequestException('Timestamp must be a number');
    }

    const normalizedInputMs = TimeUtils.isTimestampInSeconds(valNumber) ? valNumber * 1000 : valNumber;

    const supernovaActivationTimestampMs = this.apiConfigService.getSupernovaActivationTimestamp() * 1000;

    if (normalizedInputMs < supernovaActivationTimestampMs) {
      return Math.floor(normalizedInputMs / 1000);
    } else {
      return normalizedInputMs;
    }
  }
}
