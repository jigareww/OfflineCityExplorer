#import "SortEngine.h"
#import <vector>
#import <string>
#import <algorithm>

@implementation SortEngine

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)sortCities:(NSArray<NSString *> *)cities {
    if (cities == nil || cities.count == 0) {
        return @[];
    }
    
    // 1. Convert NSArray to std::vector<std::string>
    size_t count = cities.count;
    std::vector<std::string> cxxCities;
    cxxCities.reserve(count);
    
    for (NSString *city in cities) {
        cxxCities.push_back(std::string([city UTF8String] ?: ""));
    }
    
    // 2. Sort using standard C++ std::sort (IntroSort - highly optimized)
    std::sort(cxxCities.begin(), cxxCities.end());
    
    // 3. Convert std::vector<std::string> back to NSArray
    NSMutableArray<NSString *> *sorted = [NSMutableArray arrayWithCapacity:count];
    for (const auto& city : cxxCities) {
        [sorted addObject:[NSString stringWithUTF8String:city.c_str()] ?: @""];
    }
    
    return sorted;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeSortEngineSpecJSI>(params);
}

@end
