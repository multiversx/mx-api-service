/* eslint-disable require-await */

import { BatchUtils } from "@elrondnetwork/nestjs-microservice-common";

describe('Batch Utils', () => {
  it('splitArrayIntoChunks', () => {
    expect(BatchUtils.splitArrayIntoChunks([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    expect(BatchUtils.splitArrayIntoChunks([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
    expect(BatchUtils.splitArrayIntoChunks([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('splitObjectIntoChunks', () => {
    expect(BatchUtils.splitObjectIntoChunks({
      'hello1': 'world1',
      'hello2': 'world2',
      'hello3': 'world3',
      'hello4': 'world4',
    }, 2)).toEqual([
      {
        'hello1': 'world1',
        'hello2': 'world2',
      },
      {
        'hello3': 'world3',
        'hello4': 'world4',
      },
    ]);

    expect(BatchUtils.splitObjectIntoChunks({
      'hello1': 'world1',
      'hello2': 'world2',
      'hello3': 'world3',
      'hello4': 'world4',
      'hello5': 'world5',
      'hello6': 'world6',
    }, 2)).toEqual([
      {
        'hello1': 'world1',
        'hello2': 'world2',
      },
      {
        'hello3': 'world3',
        'hello4': 'world4',
      },
      {
        'hello5': 'world5',
        'hello6': 'world6',
      },
    ]);

    expect(BatchUtils.splitObjectIntoChunks({
      'hello1': 'world1',
      'hello2': 'world2',
      'hello3': 'world3',
      'hello4': 'world4',
      'hello5': 'world5',
      'hello6': 'world6',
      'hello7': 'world7',
    }, 3)).toEqual([
      {
        'hello1': 'world1',
        'hello2': 'world2',
        'hello3': 'world3',
      },
      {
        'hello4': 'world4',
        'hello5': 'world5',
        'hello6': 'world6',
      },
      {
        'hello7': 'world7',
      },
    ]);
  });

  it('batchGetSimple', async () => {
    const elements = [
      { id: '1', value: 'One' },
      { id: '2', value: 'Two' },
      { id: '3', value: 'Three' },
      { id: '4', value: 'Four' },
      { id: '5', value: 'Five' },
      { id: '6', value: 'Six' },
      { id: '7', value: 'Seven' },
    ];

    const result = await BatchUtils.batchGetSimple(
      elements,
      element => element.id.toString(),
      async elements => {
        const result: { [key: string]: string } = {};
        for (const element of elements) {
          if (['2', '7'].includes(element.id)) {
            continue;
          }

          result[element.id.toString()] = element.value + ' Processed';
        }

        return result;
      },
      3
    );

    expect(result).toEqual({
      found: {
        '1': 'One Processed',
        '3': 'Three Processed',
        '4': 'Four Processed',
        '5': 'Five Processed',
        '6': 'Six Processed',
      },
      remaining: [
        { id: '2', value: 'Two' },
        { id: '7', value: 'Seven' },
      ],
    });
  });

  it('batchGet', async () => {
    const inputElements = [
      { id: '1', value: 'One' },
      { id: '2', value: 'Two' },
      { id: '3', value: 'Three' },
      { id: '4', value: 'Four' },
      { id: '5', value: 'Five' },
      { id: '6', value: 'Six' },
      { id: '7', value: 'Seven' },
      { id: '8', value: 'Eight' },
    ];

    const l1Updates: string[] = [];
    const l2Updates: string[] = [];

    const result = await BatchUtils.batchGet<{ id: string, value: string }, string>(
      inputElements,
      element => element.id.toString(),
      [
        {
          getter: async elements => {
            const result: { [key: string]: string } = {};
            for (const element of elements) {
              if (['1', '3', '5'].includes(element.id)) {
                result[element.id.toString()] = element.value + ' L1 Cache';
              }
            }

            return result;
          },
          setter: async elements => {
            l1Updates.push(...Object.keys(elements));
          },
        },
        {
          getter: async elements => {
            const result: { [key: string]: string } = {};
            for (const element of elements) {
              if (['2', '7'].includes(element.id)) {
                result[element.id.toString()] = element.value + ' L2 Cache';
              }
            }

            return result;
          },
          setter: async elements => {
            l2Updates.push(...Object.keys(elements));
          },
        },
        {
          getter: async elements => {
            const result: { [key: string]: string } = {};
            for (const element of elements) {
              if (['4', '8'].includes(element.id)) {
                result[element.id.toString()] = element.value + ' L3 Cache';
              }
            }

            return result;
          },
        },
      ],
      3
    );

    expect(result).toEqual({
      '1': 'One L1 Cache',
      '2': 'Two L2 Cache',
      '3': 'Three L1 Cache',
      '4': 'Four L3 Cache',
      '5': 'Five L1 Cache',
      '7': 'Seven L2 Cache',
      '8': 'Eight L3 Cache',
    });

    expect(l1Updates).toEqual(['2', '4', '7', '8']);
    expect(l2Updates).toEqual(['4', '8']);
  });
});
