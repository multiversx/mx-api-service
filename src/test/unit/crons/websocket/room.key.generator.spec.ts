import { RoomKeyGenerator } from 'src/crons/websocket/room.key.generator';
import { TransactionCustomSubscribePayload } from 'src/endpoints/transactions/entities/dtos/transaction.custom.subscribe';

describe('RoomKeyGenerator', () => {
  describe('deterministicStringify', () => {
    it('sorts object keys alphabetically', () => {
      const input = { b: 2, a: 1, c: 3 } as Record<string, any>;
      const result = RoomKeyGenerator.deterministicStringify(input);
      expect(result).toBe('{"a":1,"b":2,"c":3}');
    });
  });

  describe('generate', () => {
    it('returns empty array when no active filters', () => {
      expect(
        RoomKeyGenerator.generate('', {}, TransactionCustomSubscribePayload),
      ).toEqual([]);

      expect(
        RoomKeyGenerator.generate(
          '',
          { sender: undefined, receiver: null, function: '' },
          TransactionCustomSubscribePayload,
        ),
      ).toEqual([]);
    });

    it('ignores keys not present in DTO', () => {
      const data = {
        sender: 'alice',
        receiver: 'bob',
        function: 'transfer',
        other: 123, // should be ignored
      } as Record<string, any>;

      const rooms = RoomKeyGenerator.generate('', data, TransactionCustomSubscribePayload);
      // with 3 active fields, we expect 2^3 - 1 = 7 rooms
      expect(rooms.length).toBe(7);
      // None of the room strings should include the ignored key
      expect(rooms.every((r) => !r.includes('other'))).toBe(true);
    });

    it('generates all combinations for provided filters', () => {
      const data = {
        sender: 'alice',
        receiver: 'bob',
        function: 'transfer',
      } as Record<string, any>;

      const rooms = RoomKeyGenerator.generate('', data, TransactionCustomSubscribePayload);
      // 3 active fields -> 7 combinations
      expect(rooms).toHaveLength(7);

      // Build the expected set of JSON payloads (without prefix)
      const expectedPayloads = [
        { function: 'transfer' },
        { receiver: 'bob' },
        { sender: 'alice' },
        { function: 'transfer', receiver: 'bob' },
        { function: 'transfer', sender: 'alice' },
        { receiver: 'bob', sender: 'alice' },
        { function: 'transfer', receiver: 'bob', sender: 'alice' },
      ].map((obj) => RoomKeyGenerator.deterministicStringify(obj));

      // Sort and compare as sets to avoid order sensitivity
      const sortedRooms = [...rooms].sort();
      const sortedExpected = [...expectedPayloads].sort();

      expect(sortedRooms).toEqual(sortedExpected);
    });

    it('applies custom prefix consistently vs no prefix', () => {
      const data = {
        sender: 'alice',
        receiver: 'bob',
        function: 'transfer',
      } as Record<string, any>;

      const prefix = 'custom:';
      const withPrefix = RoomKeyGenerator.generate(prefix, data, TransactionCustomSubscribePayload).sort();
      const withoutPrefix = RoomKeyGenerator.generate('', data, TransactionCustomSubscribePayload).sort();

      expect(withPrefix.length).toBe(withoutPrefix.length);
      for (let i = 0; i < withPrefix.length; i++) {
        expect(withPrefix[i]).toBe(prefix + withoutPrefix[i]);
      }
    });

    it('filters out null/undefined/empty string values', () => {
      const data = {
        sender: 'alice',
        receiver: '', // should be ignored
        function: undefined, // should be ignored
      } as Record<string, any>;

      const rooms = RoomKeyGenerator.generate('', data, TransactionCustomSubscribePayload);
      // Only one active key (sender) -> 1 combination
      expect(rooms).toHaveLength(1);
      expect(rooms[0]).toBe('{"sender":"alice"}');
    });
  });
});
