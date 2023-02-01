import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { OriginLogger } from '@elrondnetwork/erdnest';
import { EventsMetrics } from './events-metrics.map.type';

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

    incrementMetrics() {

    }

    setMetricsMap(metricsMap: EventsMetrics) {
        this.eventsToWalletsMap = this.eventsToWalletsMap;
        this.eventsToWalletsMap = metricsMap;
        this.logger.log("mapping");
    }
}
