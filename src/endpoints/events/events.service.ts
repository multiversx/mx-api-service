import { Injectable } from '@nestjs/common';
import { IndexerService } from '../../common/indexer/indexer.service';
import { QueryPagination } from '../../common/entities/query.pagination';
import { Events } from './entities/events';
import { Events as IndexerEvents } from '../../common/indexer/entities/events';
import { EventsFilter } from './entities/events.filter';

@Injectable()
export class EventsService {
  constructor(
    private readonly indexerService: IndexerService,
  ) { }

  async getEvents(pagination: QueryPagination, filter: EventsFilter): Promise<Events[]> {
    const results = await this.indexerService.getEvents(pagination, filter);

    return results ? results.map(this.mapEvent) : [];
  }

  async getEvent(txHash: string): Promise<Events | undefined> {
    const result = await this.indexerService.getEvent(txHash);

    return result ? new Events(this.mapEvent(result)) : undefined;
  }

  async getEventsCount(filter: EventsFilter): Promise<number> {
    return await this.indexerService.getEventsCount(filter);
  }

  private mapEvent(eventData: IndexerEvents): Events {
    return new Events({
      txHash: eventData._id,
      logAddress: eventData.logAddress,
      identifier: eventData.identifier,
      address: eventData.address,
      data: eventData.data,
      topics: eventData.topics,
      shardID: eventData.shardID,
      additionalData: eventData.additionalData,
      txOrder: eventData.txOrder,
      order: eventData.order,
      timestamp: eventData.timestamp,
    });
  }
}
