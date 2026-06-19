import { BadRequestException } from "@nestjs/common";
import { QueryConditionOptions } from "@multiversx/sdk-nestjs-elastic";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";

describe('RoundFilter', () => {

  it('should initialize with default values including inherited pagination properties', () => {
    const filter = new RoundFilter();

    // Inherited from QueryPagination
    expect(filter.from).toBe(0);
    expect(filter.size).toBe(25);
    expect(filter.searchAfter).toBeUndefined();

    // RoundFilter specific defaults
    expect(filter.condition).toBe(QueryConditionOptions.must);
    expect(filter.validator).toBeUndefined();
    expect(filter.shard).toBeUndefined();
    expect(filter.epoch).toBeUndefined();
  });

  it('should correctly assign custom filter and pagination properties', () => {
    const filter = new RoundFilter({
      from: 10,
      size: 50,
      validator: 'erd1testvalidatoraddress...',
      shard: 1,
      epoch: 500,
      condition: QueryConditionOptions.should
    });

    expect(filter.from).toBe(10);
    expect(filter.size).toBe(50);
    expect(filter.validator).toBe('erd1testvalidatoraddress...');
    expect(filter.shard).toBe(1);
    expect(filter.epoch).toBe(500);
    expect(filter.condition).toBe(QueryConditionOptions.should);
  });

  it('should be valid when searchAfter is provided and from is 0', () => {
    const filter = new RoundFilter({ searchAfter: 'shard-cursor-abc', from: 0 });

    expect(filter.searchAfter).toBe('shard-cursor-abc');
    expect(filter.from).toBe(0);
  });

  it('should be valid when searchAfter is provided and from is omitted', () => {
    const filter = new RoundFilter({ searchAfter: 'shard-cursor-abc' });

    expect(filter.searchAfter).toBe('shard-cursor-abc');
    expect(filter.from).toBe(0); // Falls back to default 0
  });

  it('should throw BadRequestException if searchAfter is provided and from is not 0', () => {
    expect(() => {
      new RoundFilter({ searchAfter: 'shard-cursor-abc', from: 42 });
    }).toThrow(BadRequestException);

    expect(() => {
      new RoundFilter({ searchAfter: 'shard-cursor-abc', from: 42 });
    }).toThrow("'from' must be 0 when 'searchAfter' is provided.");
  });
});
