import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { OriginLogger } from '@multiversx/sdk-nestjs';
import { EventsMetrics } from './events-metrics.map.type';
import { Event } from '../events/events.types';

/**
 * 
 * 
 * map -> event - addresses[]
 * 
 * Whenever there is an event to be sent, increment address count
 * 
 * 
 * 
 * 
 */
@Injectable()
export class EventsMetricsService {
    private eventsToWalletsMap: EventsMetrics | undefined = undefined;
    private readonly logger = new OriginLogger(EventsGateway.name);

    constructor() {
    }

    incrementMetrics(event: Event) {
        console.log("Increment by 1 " + event.address);
    }

    setMetricsMap(metricsMap: EventsMetrics) {
        this.eventsToWalletsMap = this.eventsToWalletsMap;
        this.eventsToWalletsMap = metricsMap;
        this.logger.log('---------------------');
        console.log(this.eventsToWalletsMap);
    }
}
