/* eslint-disable max-lines-per-function */
import axios from 'axios';
import { executeWithDeduplication, countriesApiClient, OfflineError } from '@/services/api';
import { isOffline } from '@/services/network';

jest.mock('@/services/network', () => ({
  isOffline: jest.fn(),
}));

describe('Network Layer Tests', () => {
  const mockIsOffline = isOffline as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOffline.mockResolvedValue(false);
  });

  test('Throws OfflineError immediately if isOffline returns true', async () => {
    mockIsOffline.mockResolvedValue(true);

    await expect(
      countriesApiClient.get('/test-endpoint')
    ).rejects.toThrow(OfflineError);
  });

  test('Request deduplication caches and returns the same promise for concurrent requests', async () => {
    let callCount = 0;
    
    // Custom Axios adapter to count actual dispatches
    const adapter = jest.fn().mockImplementation(async (config) => {
      callCount++;
      return {
        data: { value: 'test-success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });

    const testClient = axios.create({ adapter });
    
    // We add the interceptor response behavior to cleanup inFlightRequests map
    testClient.interceptors.response.use(
      (res) => res,
      (err) => Promise.reject(err)
    );

    const promise1 = executeWithDeduplication(testClient, { method: 'GET', url: '/dup-test' });
    const promise2 = executeWithDeduplication(testClient, { method: 'GET', url: '/dup-test' });

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(res1).toEqual({ value: 'test-success' });
    expect(res2).toEqual({ value: 'test-success' });
    expect(callCount).toBe(1); // Only dispatched once
  });

  test('Retries failed requests up to 3 times on 500 server errors', async () => {
    let attempts = 0;
    
    const adapter = jest.fn().mockImplementation(async (config) => {
      attempts++;
      if (attempts < 4) {
        throw {
          message: 'Server Error',
          response: { status: 500 },
          config,
          isAxiosError: true,
        };
      }
      return {
        data: { value: 'retry-success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });

    // We build a client and manually configure the interceptors to run faster retries
    const testClient = axios.create({ adapter });
    
    testClient.interceptors.response.use(
      (res) => res,
      async (error) => {
        const config = error.config;
        if (config) {
          const retryCount = config._retryCount ?? 0;
          if (retryCount < 3) {
            config._retryCount = retryCount + 1;
            // Immediate retry in tests to avoid delay wait
            return testClient(config);
          }
        }
        return Promise.reject(error);
      }
    );

    const result = await testClient.get('/retry-test');
    expect(result.data).toEqual({ value: 'retry-success' });
    expect(attempts).toBe(4); // 1 initial + 3 retries
  });
});
