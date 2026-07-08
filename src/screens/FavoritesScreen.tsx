/* eslint-disable max-lines-per-function */
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FavoritesRepository, FavoriteCityWithWeather } from '@/repositories/FavoritesRepository';
import { City } from '@/models';
import { GlassCard } from '@/components/GlassCard';
import { getWeatherDescription } from './WeatherDetails';

interface FavoritesScreenProps {
  onCitySelect: (city: City) => void;
  // Triggered to force re-render when switching tabs
  isActive: boolean;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onCitySelect, isActive }) => {
  const [favorites, setFavorites] = useState<FavoriteCityWithWeather[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const results = await FavoritesRepository.getFavoritesWithWeather();
      setFavorites(results);
    } catch (e) {
      console.error('[FavoritesScreen] Failed to load favorites:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      loadFavorites();
    }
  }, [isActive, loadFavorites]);

  const renderItem = ({ item }: { item: FavoriteCityWithWeather }) => {
    const weatherIcon = item.weatherCode !== undefined ? getWeatherDescription(item.weatherCode).icon : '❓';
    const tempText = item.temperature !== undefined ? `${Math.round(item.temperature)}°C` : '--';

    const cityObj: City = {
      id: item.id,
      name: item.name,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
    };

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => onCitySelect(cityObj)}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.cardContent}>
          <View style={styles.textColumn}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.countryName}>{item.country}</Text>
          </View>
          <View style={styles.metricsColumn}>
            <Text style={styles.weatherIcon}>{weatherIcon}</Text>
            <Text style={styles.temperature}>{tempText}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Favorites</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      ) : (
        <FlashList
          data={favorites}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You haven't favorited any cities yet.</Text>
          }
        />
      )}
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
  listContainer: {
    paddingBottom: 120,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  textColumn: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  countryName: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 4,
  },
  metricsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  temperature: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 45,
    textAlign: 'right',
  },
  loader: {
    marginTop: 64,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 64,
    fontSize: 14,
  },
});
