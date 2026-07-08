import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export type TabName = 'search' | 'favorites' | 'settings';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const CustomTabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabName; label: string; icon: string }[] = [
    { key: 'search', label: 'Search', icon: '🔍' },
    { key: 'favorites', label: 'Favorites', icon: '⭐' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginHorizontal: 4,
  },
  activeTabItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    color: '#a0a0a5',
    fontSize: 13,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#ffffff',
  },
});
