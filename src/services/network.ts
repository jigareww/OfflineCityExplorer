import DeviceStatus from '@/native/NativeDeviceStatus';

export async function isOffline(): Promise<boolean> {
  try {
    const info = await DeviceStatus.getDeviceInfo();
    return info.networkStatus === 'none';
  } catch {
    // Fallback to online if native module is unavailable (e.g., test environment)
    return false;
  }
}
