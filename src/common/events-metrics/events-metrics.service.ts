import { Injectable } from '@nestjs/common';
import { EventsMetrics } from './events-metrics.map.type';
import { Event } from '../events/events.types';
import { Gauge } from "prom-client";

@Injectable()
export class EventsMetricsService {
    private eventsToWalletsMap: EventsMetrics = new Map();
    private static eventsGauge: Gauge<string>;

    constructor() {
        if (!EventsMetricsService.eventsGauge) {
            EventsMetricsService.eventsGauge = new Gauge({
                name: 'live_events',
                help: 'Real time events for subscribed wallets',
                labelNames: ['wallet', 'address', 'identifier'],
            });
        }
    }

    incrementMetrics(event: Event) {
        // Increment wallets that track identifiers
        const id_wallets = this.eventsToWalletsMap.get(event.identifier);
        if (id_wallets) {
            for (const wallet of id_wallets) {
                EventsMetricsService.eventsGauge.inc({ wallet, identifier: event.identifier }, 1);
            }
        }

        // Increment wallets that track addresses
        const addr_wallets = this.eventsToWalletsMap.get(event.address);
        if (addr_wallets) {
            for (const wallet of addr_wallets) {
                EventsMetricsService.eventsGauge.inc({ wallet, address: event.address }, 1);
            }
        }

        // Increment wallets that track identifiers and addresses
        const id_addr_wallets = this.eventsToWalletsMap.get(event.identifier + '_' + event.address);
        if (id_addr_wallets) {
            for (const wallet of id_addr_wallets) {
                EventsMetricsService.eventsGauge.inc({ wallet, address: event.address, identifier: event.identifier }, 1);
            }
        }
    }

    setMetricsMap(metricsMap: EventsMetrics) {
        this.eventsToWalletsMap = metricsMap;
    }
}
