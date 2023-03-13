import { Injectable } from '@nestjs/common';
import { EventsMetrics } from './events-metrics.map.type';
import { Event } from '../events/events.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricsEvents } from "src/utils/metrics-events.constants";

@Injectable()
export class EventsMetricsService {
    private eventsToWalletsMap: EventsMetrics = new Map();

    constructor(private readonly eventEmitter: EventEmitter2) {
    }

    incrementMetrics(event: Event) {
        // Increment wallets that track identifiers
        const idWallets = this.eventsToWalletsMap.get(event.identifier);
        if (idWallets) {
            for (const wallet of idWallets) {
                this.eventEmitter.emit(
                    MetricsEvents.SetSubscriptionEventTriggerred,
                    wallet
                );
            }
        }

        // Increment wallets that track addresses
        const addrWallets = this.eventsToWalletsMap.get(event.address);
        if (addrWallets) {
            for (const wallet of addrWallets) {
                this.eventEmitter.emit(
                    MetricsEvents.SetSubscriptionEventTriggerred,
                    wallet
                );
            }
        }

        // Increment wallets that track identifiers and addresses
        const idAddrWallets = this.eventsToWalletsMap.get(event.identifier + '_' + event.address);
        if (idAddrWallets) {
            for (const wallet of idAddrWallets) {
                this.eventEmitter.emit(
                    MetricsEvents.SetSubscriptionEventTriggerred,
                    wallet
                );
            }
        }
    }

    setMetricsMap(metricsMap: EventsMetrics) {
        this.eventsToWalletsMap = metricsMap;
    }
}
