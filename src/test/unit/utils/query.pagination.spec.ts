import { BadRequestException } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";

describe('QueryPagination', () => {

  it('should initialize with default values', () => {
    const pagination = new QueryPagination();

    expect(pagination.from).toBe(0);
    expect(pagination.size).toBe(25);
    expect(pagination.before).toBeUndefined();
    expect(pagination.after).toBeUndefined();
    expect(pagination.searchAfter).toBeUndefined();
  });

  it('should allow overriding default values (without searchAfter)', () => {
    const pagination = new QueryPagination({ from: 10, size: 50 });

    expect(pagination.from).toBe(10);
    expect(pagination.size).toBe(50);
  });

  it('should be valid when searchAfter is provided and from is 0', () => {
    const pagination = new QueryPagination({ searchAfter: 'cursor-xyz', from: 0 });

    expect(pagination.searchAfter).toBe('cursor-xyz');
    expect(pagination.from).toBe(0);
  });

  it('should be valid when searchAfter is provided and from is omitted (defaults to 0)', () => {
    const pagination = new QueryPagination({ searchAfter: 'cursor-xyz' });

    expect(pagination.searchAfter).toBe('cursor-xyz');
    expect(pagination.from).toBe(0); // Checks that the default value kicks in safely
  });

  it('should throw BadRequestException if searchAfter is provided and from is not 0', () => {
    // Asserting that it throws the correct exception type
    expect(() => {
      new QueryPagination({ searchAfter: 'cursor-xyz', from: 5 });
    }).toThrow(BadRequestException);

    // Optional: Asserting the exact error message
    expect(() => {
      new QueryPagination({ searchAfter: 'cursor-xyz', from: 5 });
    }).toThrow("'from' must be 0 when 'searchAfter' is provided.");
  });
});
