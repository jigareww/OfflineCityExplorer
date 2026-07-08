import { useQuery } from '@tanstack/react-query';
import { WeatherRepository } from '@/repositories/WeatherRepository';
import { City, Weather } from '@/models';

export function useWeatherQuery(city: City | null) {
  return useQuery<Weather | null, Error>({
    queryKey: ['weather', city?.id],
    queryFn: async () => {
      if (!city) {
        return null;
      }
      return await WeatherRepository.getWeather(city);
    },
    enabled: !!city,
  });
}
