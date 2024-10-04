import { Injectable } from '@nestjs/common';
import { IndexerService } from '../../common/indexer/indexer.service';
import { QueryPagination } from '../../common/entities/query.pagination';
import { Events } from './entities/events';
import { EventsFilter } from './entities/events.filter';

@Injectable()
export class EventsService {
  constructor(
    private readonly indexerService: IndexerService,
  ) {}

  async getEvents(pagination: QueryPagination, filter: EventsFilter): Promise<Events[]> {
    return await this.indexerService.getEvents(pagination, filter);
  }
}
