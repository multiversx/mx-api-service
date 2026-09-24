import { ElasticIndexerHelper } from 'src/common/indexer/elastic/elastic.indexer.helper';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';

describe('ElasticIndexerHelper - events filter', () => {
  const helper = new ElasticIndexerHelper({} as any, {} as any);

  const getShardConditions = (filter: EventsFilter) => {
    const query = helper.buildEventsFilter(filter).toJson().query;
    return (query?.bool?.must ?? []).filter((condition: any) => condition.match?.shardID !== undefined);
  };

  it('filters by shard 0', () => {
    expect(getShardConditions(new EventsFilter({ shard: 0 }))).toHaveLength(1);
  });

  it('filters by a non zero shard', () => {
    expect(getShardConditions(new EventsFilter({ shard: 2 }))).toHaveLength(1);
  });

  it('does not filter by shard when it is missing', () => {
    expect(getShardConditions(new EventsFilter())).toHaveLength(0);
    expect(getShardConditions(new EventsFilter({ shard: null as any }))).toHaveLength(0);
  });
});
