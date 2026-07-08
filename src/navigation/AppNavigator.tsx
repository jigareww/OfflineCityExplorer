import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchScreen } from '@/screens/SearchScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { WeatherDetails } from '@/screens/WeatherDetails';
import { CustomTabBar, TabName } from '@/components/CustomTabBar';
import { City } from '@/models';
import { useSettingsStore } from '@/store/settingsStore';

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('search');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  const themeMode = useSettingsStore((state) => state.themeMode);
  
  const isDarkMode = themeMode !== 'light'; // Default dark mode premium layout

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0d0e15' : '#f4f5fa' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        {selectedCity ? (
          <WeatherDetails city={selectedCity} onBack={() => setSelectedCity(null)} />
        ) : (
          <>
            {activeTab === 'search' && <SearchScreen onCitySelect={handleCitySelect} />}
            {activeTab === 'favorites' && (
              <FavoritesScreen onCitySelect={handleCitySelect} isActive={activeTab === 'favorites'} />
            )}
            {activeTab === 'settings' && <SettingsScreen />}
            <CustomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </>
        )}
      </View>
    </SafeAreaView>
  );

  function handleCitySelect(city: City) {
    setSelectedCity(city);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
