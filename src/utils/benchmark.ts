import SortEngine from '@/native/NativeSortEngine';

export interface BenchmarkResult {
  jsTimeMs: number;
  nativeTimeMs: number;
  datasetSize: number;
  speedupMultiplier: number;
  isCorrect: boolean;
}

export function generateCities(count: number): string[] {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const dataset: string[] = [];

  for (let i = 0; i < count; i++) {
    const len = Math.floor(Math.random() * 7) + 6;
    let name = '';
    for (let j = 0; j < len; j++) {
      name += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    dataset.push(name);
  }

  return dataset;
}

export function runSortBenchmark(size: number = 100000): BenchmarkResult {
  const datasetForJS = generateCities(size);
  const datasetForNative = [...datasetForJS];

  // 1. JS Sort
  const startJS = Date.now();
  const sortedJS = [...datasetForJS].sort();
  const endJS = Date.now();
  const jsTimeMs = endJS - startJS;

  // 2. Native (JSI) Sort
  const startNative = Date.now();
  const sortedNative = SortEngine.sortCities(datasetForNative);
  const endNative = Date.now();
  const nativeTimeMs = endNative - startNative;

  // 3. Verify correctness
  let isCorrect = sortedJS.length === sortedNative.length;
  if (isCorrect) {
    for (let i = 0; i < sortedJS.length; i++) {
      if (sortedJS[i] !== sortedNative[i]) {
        isCorrect = false;
        break;
      }
    }
  }

  const speedupMultiplier =
    nativeTimeMs > 0 ? jsTimeMs / nativeTimeMs : jsTimeMs;

  return {
    jsTimeMs,
    nativeTimeMs,
    datasetSize: size,
    speedupMultiplier,
    isCorrect,
  };
}
