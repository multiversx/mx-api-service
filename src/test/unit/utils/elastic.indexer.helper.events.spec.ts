import { ElasticIndexerHelper } from 'src/common/indexer/elastic/elastic.indexer.helper';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';

describe('ElasticIndexerHelper - events filter', () => {
  const helper = new ElasticIndexerHelper({} as any, {} as any);

  const getMatchConditions = (filter: EventsFilter, field: string) => {
    const query = helper.buildEventsFilter(filter).toJson().query;
    return (query?.bool?.must ?? []).filter((condition: any) => condition.match?.[field] !== undefined);
  };

  it('filters by shard 0', () => {
    expect(getMatchConditions(new EventsFilter({ shard: 0 }), 'shardID')).toEqual([{ match: { shardID: 0 } }]);
  });

  it('filters by a non zero shard', () => {
    expect(getMatchConditions(new EventsFilter({ shard: 2 }), 'shardID')).toEqual([{ match: { shardID: 2 } }]);
  });

  it('does not filter by shard when it is missing', () => {
    expect(getMatchConditions(new EventsFilter(), 'shardID')).toHaveLength(0);
    expect(getMatchConditions(new EventsFilter({ shard: null as any }), 'shardID')).toHaveLength(0);
  });

  it('filters by order 0', () => {
    expect(getMatchConditions(new EventsFilter({ order: 0 }), 'order')).toEqual([{ match: { order: 0 } }]);
  });

  it('filters by a non zero order', () => {
    expect(getMatchConditions(new EventsFilter({ order: 3 }), 'order')).toEqual([{ match: { order: 3 } }]);
  });

  it('does not filter by order when it is missing', () => {
    expect(getMatchConditions(new EventsFilter(), 'order')).toHaveLength(0);
    expect(getMatchConditions(new EventsFilter({ order: null as any }), 'order')).toHaveLength(0);
  });
});
