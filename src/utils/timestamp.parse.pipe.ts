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

    if (valNumber <= 0) {
      throw new BadRequestException('Timestamp must be a positive number');
    }

    const normalizedInputMs = TimeUtils.isTimestampInSeconds(valNumber) ? valNumber * 1000 : valNumber;
    if (!this.apiConfigService.isChainBarnardEnabled()) {
      return Math.floor(normalizedInputMs / 1000);
    }

    const barnardActivationTimestamp = this.apiConfigService.getChainBarnardActivationTimestamp() * 1000;

    if (normalizedInputMs < barnardActivationTimestamp) {
      return Math.floor(normalizedInputMs / 1000);
    } else {
      return normalizedInputMs;
    }
  }
}
