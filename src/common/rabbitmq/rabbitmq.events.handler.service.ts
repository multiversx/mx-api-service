import { Injectable } from '@nestjs/common';
import { OriginLogger } from '@elrondnetwork/erdnest';
import { EventsGateway } from '../events/events.gateway';
import { NotifierEvent } from './entities/notifier.event';

@Injectable()
export class RabbitMqEventsHandlerService {
    private readonly logger = new OriginLogger(RabbitMqEventsHandlerService.name);

    constructor(
        private readonly eventsGateway: EventsGateway,
    ) { }

    async sendNotification(data: NotifierEvent) {
        this.logger.log(`Sending data on Event Websocket for transaction: ${data.txHash}`);
        await this.eventsGateway.sendNotification(data);
    }

}
