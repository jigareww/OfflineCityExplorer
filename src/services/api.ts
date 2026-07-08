/* eslint-disable max-lines-per-function */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { isOffline } from './network';

export class OfflineError extends Error {
  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'OfflineError';
  }
}

const inFlightRequests = new Map<string, Promise<unknown>>();

function buildRequestKey(method?: string, url?: string, params?: unknown, data?: unknown): string {
  return `${method || ''}:${url || ''}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
}

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

function configureInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const offline = await isOffline();
      if (offline) {
        throw new OfflineError();
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const key = buildRequestKey(
        response.config.method,
        response.config.url,
        response.config.params,
        response.config.data
      );
      inFlightRequests.delete(key);
      return response;
    },
    async (error: unknown) => {
      // Axios error type assertion
      if (axios.isAxiosError(error)) {
        const config = error.config as CustomRequestConfig | undefined;
        
        if (config) {
          const key = buildRequestKey(config.method, config.url, config.params, config.data);
          inFlightRequests.delete(key);

          const isNetworkError = !error.response;
          const isServerError = error.response && error.response.status && error.response.status >= 500;
          const retryCount = config._retryCount ?? 0;

          if ((isNetworkError || isServerError) && retryCount < MAX_RETRIES && error.code !== 'ERR_CANCELED') {
            config._retryCount = retryCount + 1;
            
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 200;
            console.log(`[API] Retrying query. Attempt ${config._retryCount}/${MAX_RETRIES} in ${Math.round(delay)}ms...`);
            
            await new Promise<void>(resolve => setTimeout(resolve, delay));
            return instance(config);
          }
        }
      }

      return Promise.reject(error);
    }
  );
}

export const countriesApiClient = axios.create({
  baseURL: 'https://countriesnow.space/api/v0.1',
  timeout: DEFAULT_TIMEOUT,
});

export const weatherApiClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: DEFAULT_TIMEOUT,
});

configureInterceptors(countriesApiClient);
configureInterceptors(weatherApiClient);

export async function executeWithDeduplication<T = unknown>(
  instance: AxiosInstance,
  config: AxiosRequestConfig
): Promise<T> {
  const key = buildRequestKey(config.method, config.url, config.params, config.data);
  
  if (inFlightRequests.has(key)) {
    console.log(`[API] Deduplicating request: ${key}`);
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = instance(config).then(res => res.data as T);
  inFlightRequests.set(key, promise);
  
  try {
    return await promise;
  } finally {
    inFlightRequests.delete(key);
  }
}
