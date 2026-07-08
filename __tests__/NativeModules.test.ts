import { generateCities, runSortBenchmark } from '@/utils/benchmark';
import SortEngine from '@/native/NativeSortEngine';

// Mock the SortEngine native module
jest.mock('@/native/NativeSortEngine', () => {
  return {
    __esModule: true,
    default: {
      sortCities: jest.fn((cities: string[]) => {
        // Mock native sort using JS sort
        return [...cities].sort();
      }),
    },
  };
});

describe('NativeModules & Sorting Benchmark Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateCities produces correct dataset size and word lengths', () => {
    const size = 50;
    const cities = generateCities(size);

    expect(cities).toHaveLength(size);
    cities.forEach(city => {
      expect(typeof city).toBe('string');
      expect(city.length).toBeGreaterThanOrEqual(6);
      expect(city.length).toBeLessThanOrEqual(12);
    });
  });

  test('runSortBenchmark calls SortEngine.sortCities and compares results correctly', () => {
    const size = 100;
    const result = runSortBenchmark(size);

    expect(SortEngine.sortCities).toHaveBeenCalledTimes(1);
    expect(result.datasetSize).toBe(size);
    expect(result.isCorrect).toBe(true);
    expect(result.jsTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.nativeTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.speedupMultiplier).toBeGreaterThanOrEqual(0);
  });
});
