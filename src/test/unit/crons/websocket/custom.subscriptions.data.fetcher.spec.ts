import { CustomSubscriptionsDataFetcher } from 'src/crons/websocket/custom.subscriptions.data.fetcher';
import { Events } from 'src/endpoints/events/entities/events';

describe('CustomSubscriptionsDataFetcher', () => {
  let getTransfers: jest.Mock;
  let getEvents: jest.Mock;
  let fetcher: CustomSubscriptionsDataFetcher;

  beforeEach(() => {
    getTransfers = jest.fn().mockResolvedValue([]);
    getEvents = jest.fn().mockResolvedValue([]);

    fetcher = new CustomSubscriptionsDataFetcher(
      { getTransfers } as any,
      { getEvents } as any,
    );
  });

  it('retries a failed fetch until it succeeds', async () => {
    getTransfers
      .mockRejectedValueOnce(new Error('elastic unavailable'))
      .mockRejectedValueOnce(new Error('elastic unavailable'))
      .mockResolvedValueOnce([{ txHash: 'a' }]);

    const roundData = await fetcher.fetchRoundData(1000);

    expect(getTransfers).toHaveBeenCalledTimes(3);
    expect(roundData.transfers).toHaveLength(1);
  });

  it('goes on without the data after 3 retries', async () => {
    getTransfers.mockRejectedValue(new Error('elastic unavailable'));
    getEvents.mockResolvedValue([new Events({ txHash: 'a' })]);

    const roundData = await fetcher.fetchRoundData(1000);

    expect(getTransfers).toHaveBeenCalledTimes(4);
    expect(roundData.transfers).toEqual([]);
    expect(roundData.transactions).toEqual([]);
    expect(roundData.events).toHaveLength(1);
  });

  it('does not fetch again what already succeeded', async () => {
    getEvents.mockRejectedValueOnce(new Error('elastic unavailable'));

    await fetcher.fetchRoundData(1000);

    expect(getTransfers).toHaveBeenCalledTimes(1);
    expect(getEvents).toHaveBeenCalledTimes(2);
  });
});
