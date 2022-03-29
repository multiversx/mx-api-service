import { Injectable, Logger } from '@nestjs/common';
import { NftCreateEvent } from './entities/nft/nft-create.event';

@Injectable()
export class RabbitMqNftHandlerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(RabbitMqNftHandlerService.name);
  }

  // eslint-disable-next-line require-await
  public async handleNftCreateEvent(event: NftCreateEvent): Promise<void> {
    this.logger.log(event);  // TODO
  }
}
