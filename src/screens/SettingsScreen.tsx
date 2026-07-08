import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { useSettingsStore, ThemeMode } from '@/store/settingsStore';
import { GlassCard } from '@/components/GlassCard';
import DeviceStatus, { DeviceInfo } from '@/native/NativeDeviceStatus';

export const SettingsScreen: React.FC = () => {
  const { themeMode, offlineSimulation, setThemeMode, toggleOfflineSimulation } = useSettingsStore();
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const info = await DeviceStatus.getDeviceInfo();
        setDeviceInfo(info);
      } catch (e) {
        console.error('[SettingsScreen] Failed to retrieve device diagnostics:', e);
      }
    };
    fetchDiagnostics();
  }, []);

  const themes: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: '☀️ Light' },
    { key: 'dark', label: '🌙 Dark' },
    { key: 'system', label: '⚙️ System' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>Appearance</Text>
      <GlassCard style={styles.card}>
        <View style={styles.themeSelector}>
          {themes.map((t) => {
            const isActive = themeMode === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.themeOption, isActive && styles.activeThemeOption]}
                onPress={() => setThemeMode(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.themeLabel, isActive && styles.activeThemeLabel]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <Text style={styles.sectionHeader}>Offline Simulation</Text>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Simulate Offline Mode</Text>
            <Text style={styles.rowSubtitle}>Force the application to act as if it has no connectivity.</Text>
          </View>
          <Switch
            value={offlineSimulation}
            onValueChange={toggleOfflineSimulation}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={offlineSimulation ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </GlassCard>

      <Text style={styles.sectionHeader}>Device Diagnostics</Text>
      <GlassCard style={styles.card}>
        {deviceInfo ? (
          <View style={styles.diagnosticsList}>
            <View style={styles.diagnosticRow}>
              <Text style={styles.diagnosticLabel}>Device Name</Text>
              <Text style={styles.diagnosticValue}>{deviceInfo.deviceName}</Text>
            </View>
            <View style={styles.diagnosticRow}>
              <Text style={styles.diagnosticLabel}>Model</Text>
              <Text style={styles.diagnosticValue}>{deviceInfo.deviceModel}</Text>
            </View>
            <View style={styles.diagnosticRow}>
              <Text style={styles.diagnosticLabel}>Network Status</Text>
              <Text style={styles.diagnosticValue}>{deviceInfo.networkStatus}</Text>
            </View>
            <View style={styles.diagnosticRow}>
              <Text style={styles.diagnosticLabel}>Battery Level</Text>
              <Text style={styles.diagnosticValue}>{Math.round(deviceInfo.batteryPercentage * 100)}%</Text>
            </View>
            <View style={styles.diagnosticRow}>
              <Text style={styles.diagnosticLabel}>GPS Location Enabled</Text>
              <Text style={styles.diagnosticValue}>{deviceInfo.gpsAvailable ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.rowSubtitle}>Diagnostics unavailable.</Text>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  sectionHeader: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeThemeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  themeLabel: {
    color: '#8e8e93',
    fontWeight: '600',
    fontSize: 13,
  },
  activeThemeLabel: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    marginRight: 16,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  diagnosticsList: {
    width: '100%',
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  diagnosticLabel: {
    color: '#8e8e93',
    fontSize: 14,
  },
  diagnosticValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
