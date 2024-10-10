import { Injectable } from '@nestjs/common';
import { IndexerService } from '../../common/indexer/indexer.service';
import { QueryPagination } from '../../common/entities/query.pagination';
import { Events } from './entities/events';
import { EventsFilter } from './entities/events.filter';

@Injectable()
export class EventsService {
  constructor(
    private readonly indexerService: IndexerService,
  ) { }

  async getEvents(pagination: QueryPagination, filter: EventsFilter): Promise<Events[]> {
    return await this.indexerService.getEvents(pagination, filter);
  }

  async getEvent(txHash: string): Promise<Events | undefined> {
    const result = await this.indexerService.getEvent(txHash);
    return result ? result : undefined;
  }

  async getEventsCount(filter: EventsFilter): Promise<number> {
    return await this.indexerService.getEventsCount(filter);
  }
}
