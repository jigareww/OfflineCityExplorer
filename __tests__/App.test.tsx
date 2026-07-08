/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Mock JSI and Native Modules
jest.mock('@/native/NativeDeviceStatus', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn(() => Promise.resolve({
      batteryPercentage: 0.8,
      networkStatus: 'wifi',
      gpsAvailable: true,
      deviceName: 'Mock Device',
      deviceModel: 'Mock Model',
      osVersion: '16.0'
    })),
  },
}));

jest.mock('react-native-mmkv', () => {
  return {
    createMMKV: jest.fn(() => ({
      set: jest.fn(),
      getString: jest.fn(() => 'system'),
      getBoolean: jest.fn(() => false),
      remove: jest.fn(),
      clearAll: jest.fn(),
    })),
  };
});

jest.mock('@op-engineering/op-sqlite', () => {
  return {
    open: jest.fn(() => ({
      executeSync: jest.fn(),
      execute: jest.fn(() => Promise.resolve({ rows: [], rowsAffected: 0 })),
      transaction: jest.fn((callback) => callback({ execute: jest.fn() })),
    })),
  };
});

// Mock Safe Area Context to avoid layout provider errors
jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock FlashList to use standard FlatList inside tests, avoiding ESM syntax errors
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: FlatList,
  };
});

// Mock react-native-background-fetch
jest.mock('react-native-background-fetch', () => {
  return {
    configure: jest.fn((_options, callback) => {
      // Simulate task invocation in tests
      callback('test-task-id');
    }),
    finish: jest.fn(),
    NETWORK_TYPE_ANY: 1,
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
