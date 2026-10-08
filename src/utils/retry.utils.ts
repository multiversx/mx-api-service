export class RetryUtils {
  static async retry<T>(action: () => Promise<T>, maxRetries: number, delayMs: number, onRetry: (retry: number) => void): Promise<T> {
    let lastError: unknown;
    for (let retry = 0; retry <= maxRetries; retry++) {
      if (retry > 0) {
        onRetry(retry);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      try {
        return await action();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
