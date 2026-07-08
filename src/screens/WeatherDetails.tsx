import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useWeatherQuery } from '@/hooks/useWeatherQuery';
import { useFavoritesStore } from '@/store/favoritesStore';
import { City } from '@/models';
import { GlassCard } from '@/components/GlassCard';

interface WeatherDetailsProps {
  city: City;
  onBack: () => void;
}

export function getWeatherDescription(code: number): { text: string; icon: string } {
  if (code === 0) {
    return { text: 'Clear Sky', icon: '☀️' };
  }
  if (code >= 1 && code <= 3) {
    return { text: 'Partly Cloudy', icon: '⛅' };
  }
  if (code === 45 || code === 48) {
    return { text: 'Foggy', icon: '🌫️' };
  }
  if (code >= 51 && code <= 55) {
    return { text: 'Drizzle', icon: '🌦️' };
  }
  if (code >= 61 && code <= 65) {
    return { text: 'Rainy', icon: '🌧️' };
  }
  if (code >= 71 && code <= 77) {
    return { text: 'Snowy', icon: '❄️' };
  }
  if (code >= 80 && code <= 82) {
    return { text: 'Showers', icon: '🌧️' };
  }
  if (code >= 95 && code <= 99) {
    return { text: 'Thunderstorm', icon: '⛈️' };
  }
  return { text: 'Unknown', icon: '❓' };
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ city, onBack }) => {
  const { data: weather, error, isLoading } = useWeatherQuery(city);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const isFav = favorites.includes(city.id);

  const handleToggleFav = async () => {
    await toggleFavorite(city.id);
  };

  const weatherDesc = weather ? getWeatherDescription(weather.weatherCode) : { text: 'N/A', icon: '❓' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favButton} onPress={handleToggleFav} activeOpacity={0.7}>
          <Text style={styles.favButtonText}>{isFav ? '★ Favorited' : '☆ Favorite'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.cityName}>{city.name}</Text>
        <Text style={styles.countryName}>{city.country}</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
        ) : error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>Failed to retrieve weather details.</Text>
            <Text style={styles.errorSubtext}>Please verify your connectivity and try again.</Text>
          </GlassCard>
        ) : weather ? (
          <View style={styles.weatherInfo}>
            <GlassCard style={styles.tempCard}>
              <Text style={styles.weatherIcon}>{weatherDesc.icon}</Text>
              <Text style={styles.tempText}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.conditionText}>{weatherDesc.text}</Text>
            </GlassCard>

            <View style={styles.metricsContainer}>
              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricIcon}>💧</Text>
                <Text style={styles.metricValue}>{weather.humidity}%</Text>
                <Text style={styles.metricLabel}>Humidity</Text>
              </GlassCard>

              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricIcon}>💨</Text>
                <Text style={styles.metricValue}>{weather.windSpeed} km/h</Text>
                <Text style={styles.metricLabel}>Wind Speed</Text>
              </GlassCard>
            </View>

            <Text style={styles.cacheText}>
              Last updated: {new Date(weather.cachedAt).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noDataText}>No weather metrics available.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  favButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  favButtonText: {
    color: '#ffcc00',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  countryName: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
    marginBottom: 32,
    textAlign: 'center',
  },
  weatherInfo: {
    width: '100%',
    alignItems: 'center',
  },
  tempCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  tempText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#fff',
  },
  conditionText: {
    fontSize: 18,
    color: '#eee',
    marginTop: 8,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 16,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  cacheText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  loader: {
    marginTop: 64,
  },
  errorCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  noDataText: {
    color: '#888',
    marginTop: 64,
  },
});
