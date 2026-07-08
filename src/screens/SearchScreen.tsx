import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CityRepository } from '@/repositories/CityRepository';
import { City } from '@/models';
import { GlassCard } from '@/components/GlassCard';

interface SearchScreenProps {
  onCitySelect: (city: City) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onCitySelect }) => {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchCities = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await CityRepository.searchCities(searchQuery, 30, 0);
      setCities(results);
    } catch (e) {
      console.error('[SearchScreen] Failed to search cities:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitialCount = useCallback(async () => {
    try {
      const count = await CityRepository.getCityCount();
      setTotalCount(count);
      if (count > 0) {
        await fetchCities('');
      }
    } catch (e) {
      console.error('[SearchScreen] Failed to count cities:', e);
    }
  }, [fetchCities]);

  useEffect(() => {
    loadInitialCount();
  }, [loadInitialCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (totalCount > 0) {
        fetchCities(query);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query, totalCount, fetchCities]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await CityRepository.syncCities();
      await loadInitialCount();
    } catch (e) {
      console.error('[SearchScreen] Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const renderItem = ({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => onCitySelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.cityName}>{item.name}</Text>
      <Text style={styles.countryName}>{item.country}</Text>
    </TouchableOpacity>
  );

  if (totalCount === 0) {
    return (
      <View style={styles.emptyContainer}>
        <GlassCard style={styles.syncCard}>
          <Text style={styles.title}>Welcome to Offline City Explorer</Text>
          <Text style={styles.description}>
            To start searching, download the global cities catalog. Once downloaded, you can search and toggle favorites completely offline.
          </Text>
          {syncing ? (
            <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.syncButton} onPress={handleSync} activeOpacity={0.8}>
              <Text style={styles.syncButtonText}>📥 Download Catalog</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search cities..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      ) : (
        <FlashList
          data={cities}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No cities found matching "{query}"</Text>
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
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 120,
  },
  cityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  countryName: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  loader: {
    marginTop: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  syncCard: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  syncButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyListText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});
