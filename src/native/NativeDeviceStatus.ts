import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface DeviceInfo {
  batteryPercentage: number;
  networkStatus: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAvailable: boolean;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
}

export interface Spec extends TurboModule {
  getDeviceInfo(): Promise<DeviceInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeviceStatus');
