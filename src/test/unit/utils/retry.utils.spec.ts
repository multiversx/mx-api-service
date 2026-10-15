import { RetryUtils } from 'src/utils/retry.utils';

describe('RetryUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the result of the first successful attempt', async () => {
    const action = jest.fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce('result');
    const onRetry = jest.fn();

    const resultPromise = RetryUtils.retry(action, 3, 500, onRetry);
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe('result');
    expect(action).toHaveBeenCalledTimes(2);
    expect(onRetry.mock.calls).toEqual([[1]]);
  });

  it('throws the last error after all the retries fail', async () => {
    const action = jest.fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('last'));

    const resultPromise = RetryUtils.retry(action, 2, 500, jest.fn());
    const assertion = expect(resultPromise).rejects.toThrow('last');
    await jest.runAllTimersAsync();
    await assertion;

    expect(action).toHaveBeenCalledTimes(3);
  });
});
