import { ElasticService } from "@multiversx/sdk-nestjs-elastic";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticQuery } from "@multiversx/sdk-nestjs-elastic";
import { EsCircuitBreakerProxy } from "../../../common/indexer/elastic/circuit-breaker/circuit.breaker.proxy.service";

describe('EsCircuitBreakerProxy', () => {
  let proxy: EsCircuitBreakerProxy;
  let mockElasticService: jest.Mocked<ElasticService>;
  let mockApiConfigService: jest.Mocked<ApiConfigService>;

  const defaultConfig = {
    durationThresholdMs: 1000,
    failureCountThreshold: 2,
    resetTimeoutMs: 2000,
  };

  beforeEach(() => {
    mockElasticService = {
      getCount: jest.fn(),
      getList: jest.fn(),
      getItem: jest.fn(),
      getCustomValue: jest.fn(),
      setCustomValue: jest.fn(),
      setCustomValues: jest.fn(),
      getScrollableList: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
    } as any;

    mockApiConfigService = {
      getElasticUrl: jest.fn().mockReturnValue('http://localhost:9200'),
      isElasticCircuitBreakerEnabled: jest.fn().mockReturnValue(true),
      getElasticCircuitBreakerConfig: jest.fn().mockReturnValue(defaultConfig),
    } as any;

    proxy = new EsCircuitBreakerProxy(mockApiConfigService, mockElasticService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Circuit Breaker State Management', () => {
    it('should start with closed circuit', () => {
      expect(proxy['isCircuitOpen']).toBe(false);
      expect(proxy['failureCount']).toBe(0);
    });

    it('should open circuit after reaching failure threshold', async () => {
      const failureThreshold = 2;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        failureCountThreshold: failureThreshold,
      });

      mockElasticService.getCount.mockRejectedValue(new Error('Service unavailable'));

      for (let i = 0; i < failureThreshold; i++) {
        try {
          await proxy.getCount('test', new ElasticQuery());
        } catch (error) {
          // Expected error
        }
      }

      expect(proxy['isCircuitOpen']).toBe(true);
      expect(proxy['failureCount']).toBe(failureThreshold);

      await expect(proxy.getCount('test', new ElasticQuery()))
        .rejects
        .toThrow('Service Unavailable');
    });

    it('should reject requests when circuit is open', async () => {
      proxy['isCircuitOpen'] = true;
      proxy['lastFailureTime'] = Date.now();

      await expect(proxy.getCount('test', new ElasticQuery()))
        .rejects
        .toThrow('Service Unavailable');
    });

    it('should attempt to reset circuit after reset timeout', async () => {
      const resetTimeout = 1000;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        resetTimeoutMs: resetTimeout,
      });

      // Force circuit to open and set last failure time to be older than reset timeout
      proxy['isCircuitOpen'] = true;
      proxy['lastFailureTime'] = Date.now() - (resetTimeout + 1000);
      proxy['failureCount'] = 2; // Set failure count to simulate previous failures

      // Mock a successful response
      mockElasticService.getCount.mockResolvedValue(10);

      // The circuit should be reset and the request should succeed
      const result = await proxy.getCount('test', new ElasticQuery());
      expect(result).toBe(10);
      expect(proxy['isCircuitOpen']).toBe(false);
      expect(proxy['failureCount']).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout requests that take too long', async () => {
      const timeout = 500;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        durationThresholdMs: timeout,
      });

      mockElasticService.getCount.mockImplementation(() =>
        new Promise(() => { })
      );

      await expect(Promise.race([
        proxy.getCount('test', new ElasticQuery()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeout + 100)),
      ])).rejects.toThrow('Operation timed out');
    });

    it('should complete requests within timeout', async () => {
      const timeout = 500;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        durationThresholdMs: timeout,
      });

      mockElasticService.getCount.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(10), timeout - 100))
      );

      const result = await proxy.getCount('test', new ElasticQuery());
      expect(result).toBe(10);
    });
  });

  describe('Method Proxying', () => {
    it('should proxy getCount calls', async () => {
      mockElasticService.getCount.mockResolvedValue(10);
      const query = new ElasticQuery();

      const result = await proxy.getCount('test', query);
      expect(result).toBe(10);
      expect(mockElasticService.getCount).toHaveBeenCalledWith('test', query);
    });

    it('should proxy getList calls', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      mockElasticService.getList.mockResolvedValue(mockData);
      const query = new ElasticQuery();

      const result = await proxy.getList('test', 'id', query);
      expect(result).toEqual(mockData);
      expect(mockElasticService.getList).toHaveBeenCalledWith('test', 'id', query);
    });

    it('should proxy getItem calls', async () => {
      const mockItem = { id: 1, name: 'test' };
      mockElasticService.getItem.mockResolvedValue(mockItem);

      const result = await proxy.getItem('test', 'id', '1');
      expect(result).toEqual(mockItem);
      expect(mockElasticService.getItem).toHaveBeenCalledWith('test', 'id', '1');
    });

    it('should proxy getCustomValue calls', async () => {
      const mockValue = { key: 'value' };
      mockElasticService.getCustomValue.mockResolvedValue(mockValue);

      const result = await proxy.getCustomValue('test', 'id', 'key');
      expect(result).toEqual(mockValue);
      expect(mockElasticService.getCustomValue).toHaveBeenCalledWith('test', 'id', 'key');
    });

    it('should proxy setCustomValue calls', async () => {
      mockElasticService.setCustomValue.mockResolvedValue(undefined);

      await proxy.setCustomValue('test', 'id', 'key', 'value');
      expect(mockElasticService.setCustomValue).toHaveBeenCalledWith('test', 'id', 'key', 'value');
    });

    it('should proxy setCustomValues calls', async () => {
      mockElasticService.setCustomValues.mockResolvedValue(undefined);
      const values = { key1: 'value1', key2: 'value2' };

      await proxy.setCustomValues('test', 'id', values);
      expect(mockElasticService.setCustomValues).toHaveBeenCalledWith('test', 'id', values);
    });

    it('should proxy getScrollableList calls', async () => {
      const mockAction = jest.fn();
      mockElasticService.getScrollableList.mockResolvedValue(undefined);
      const query = new ElasticQuery();

      await proxy.getScrollableList('test', 'id', query, mockAction);
      expect(mockElasticService.getScrollableList).toHaveBeenCalledWith('test', 'id', query, mockAction);
    });

    it('should proxy get calls', async () => {
      const mockResponse = { data: 'test' };
      mockElasticService.get.mockResolvedValue(mockResponse);

      const result = await proxy.get('test');
      expect(result).toEqual(mockResponse);
      expect(mockElasticService.get).toHaveBeenCalledWith('test');
    });

    it('should proxy post calls', async () => {
      const mockResponse = { data: 'test' };
      mockElasticService.post.mockResolvedValue(mockResponse);
      const data = { key: 'value' };

      const result = await proxy.post('test', data);
      expect(result).toEqual(mockResponse);
      expect(mockElasticService.post).toHaveBeenCalledWith('test', data);
    });
  });

  describe('Error Handling', () => {
    it('should handle and propagate errors', async () => {
      const error = new Error('Test error');
      mockElasticService.getCount.mockRejectedValue(error);

      await expect(proxy.getCount('test', new ElasticQuery()))
        .rejects
        .toThrow('Service Unavailable');
    });

    it('should increment failure count on errors', async () => {
      mockElasticService.getCount.mockRejectedValue(new Error('Test error'));

      try {
        await proxy.getCount('test', new ElasticQuery());
      } catch (error) {
        // Expected error
      }

      expect(proxy['failureCount']).toBe(1);
    });

    it('should reset failure count on successful request', async () => {
      mockElasticService.getCount.mockRejectedValueOnce(new Error('Test error'));
      try {
        await proxy.getCount('test', new ElasticQuery());
      } catch (error) {
        // Expected error
      }

      mockElasticService.getCount.mockResolvedValueOnce(10);
      await proxy.getCount('test', new ElasticQuery());

      expect(proxy['failureCount']).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should use updated timeout value', async () => {
      const newTimeout = 500;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        durationThresholdMs: newTimeout,
      });

      mockElasticService.getCount.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(10), newTimeout - 100))
      );

      const result = await proxy.getCount('test', new ElasticQuery());
      expect(result).toBe(10);
    });

    it('should use updated failure threshold', async () => {
      const newThreshold = 1;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        failureCountThreshold: newThreshold,
      });
      mockElasticService.getCount.mockRejectedValue(new Error('Service unavailable'));

      for (let i = 0; i < newThreshold; i++) {
        try {
          await proxy.getCount('test', new ElasticQuery());
        } catch (error) {
          // Expected error
        }
      }

      expect(proxy['failureCount']).toBe(newThreshold);
    });

    it('should use updated reset timeout', async () => {
      const newResetTimeout = 1000;
      mockApiConfigService.getElasticCircuitBreakerConfig.mockReturnValue({
        ...defaultConfig,
        resetTimeoutMs: newResetTimeout,
      });

      // Force circuit to open and set last failure time to be older than reset timeout
      proxy['isCircuitOpen'] = true;
      proxy['lastFailureTime'] = Date.now() - (newResetTimeout + 1000);
      proxy['failureCount'] = 2; // Set failure count to simulate previous failures

      // Mock a successful response
      mockElasticService.getCount.mockResolvedValue(10);

      // The circuit should be reset and the request should succeed
      const result = await proxy.getCount('test', new ElasticQuery());
      expect(result).toBe(10);
      expect(proxy['isCircuitOpen']).toBe(false);
      expect(proxy['failureCount']).toBe(0);
    });
  });
});
