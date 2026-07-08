# Task List: Offline City Explorer

## Milestone 1: Project Initialization & Configuration
- [x] Run React Native CLI to initialize `OfflineCityExplorer` in `/Users/jigarsolanki/Documents/Jigar/OfflineCityExplorer`
- [x] Set up project directory structure (`src/app`, `src/features`, etc.)
- [x] Install package dependencies (Zustand, TanStack Query, MMKV, SQLite, Axios, etc.)
- [x] Configure strict TypeScript (`tsconfig.json`) and path mapping aliases (`@/*`)
- [x] Configure `babel.config.js` and `metro.config.js` to resolve `@/*` imports
- [x] Configure linting and formatting (ESLint, Prettier, Husky, lint-staged)
- [x] Verify project builds, lints, and typechecks successfully

## Milestone 2: Native Layer (TurboModules & JSI Sort Engine)
- [x] Add codegenConfig configuration in package.json
- [x] Create TypeScript specifications for TurboModules (`NativeDeviceStatus.ts` and `NativeSortEngine.ts`) in `src/native/`
- [x] Implement `DeviceStatus` and `SortEngine` TurboModules in Android (Kotlin)
- [x] Implement `DeviceStatus` and `SortEngine` TurboModules in iOS (ObjC++/C++)
- [x] Write unit tests and a benchmark test script measuring JS sort vs JSI sort on 100,000 cities
- [x] Compile and verify the native builds run and pass benchmark checks

## Milestone 3: Database & Local Storage Layer (SQLite & MMKV)
- [x] Configure SQLite and initialize schemas for Cities, Weather, Favorites, and Sync Queue
- [x] Configure MMKV storage for lightweight key-value preferences
- [x] Implement database helper service with migrations support
- [x] Abstract database access behind Repositories (City, Weather, Favorites)
- [x] Write unit tests for database and repositories

## Milestone 4: Network Layer (Axios with Offline Handling & Retry)
- [x] Create Axios API client config with timeout, retry, and cancellation
- [x] Implement request deduplication and response transformation interceptors
- [x] Configure offline network detection and recovery retry wrappers
- [x] Write unit and integration tests for network requests and retry mechanisms

## Milestone 5: Domain Models, Repositories, and Sync Coordination
- [x] Implement CountriesNow API city synchronization in CityRepository
- [x] Implement Open-Meteo API weather retrieval and caching in WeatherRepository
- [x] Implement Favorites remote sync service triggers inside FavoritesRepository
- [x] Write integration and repository sync tests

## Milestone 6: State Management & Sync Queue Service (Zustand & React Query)
- [x] Set up Zustand stores for theme settings, offline simulation, and favorites
- [x] Configure React Query query clients and custom hooks for weather forecasts
- [x] Implement SyncQueueService to process and sync offline mutation queues
- [x] Write tests verifying store updates and sync queue executions

## Milestone 7: UI Layer & Screens (City Search, Weather Details, Favorites dashboard, Settings)
- [x] Set up navigation layout and custom bottom tabs
- [x] Create search screen with FlashList autocomplete
- [x] Create weather details screen with forecast metrics and favorite toggles
- [x] Create favorites dashboard with cached metrics
- [x] Create settings panel for dark/light themes and offline simulator

## Milestone 8: Background Tasks & Network Monitoring (Sync Queue Trigger, NetInfo)
- [x] Configure background fetch jobs triggering sync queue processing
- [x] Set up foreground/active app listeners syncing data immediately on connectivity recovery
- [x] Validate background fetch configs compile successfully

## Milestone 9: Build Verification & Native Compilation
- [x] Verify Android builds compile successfully (`BUILD SUCCESSFUL`)
- [x] Verify iOS builds resolve dependencies cleanly (`Pod installation complete!`)

## Milestone 10: Final Documentation & Production Polish
- [x] Complete final code walkthrough and review
- [x] Finalize implementation documentation report
