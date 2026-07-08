import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  sortCities(cities: string[]): string[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SortEngine');
