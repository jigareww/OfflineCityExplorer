export interface City {
  id: string; // "cityName:countryName"
  name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  population?: number;
}

export interface Weather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  cachedAt: number;
}

export interface PendingMutation {
  id: number;
  actionType: 'ADD_FAVORITE' | 'REMOVE_FAVORITE';
  payload: {
    cityId: string;
    timestamp: number;
  };
  timestamp: number;
  retryCount: number;
}
