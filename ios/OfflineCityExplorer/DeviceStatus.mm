#import "DeviceStatus.h"
#import <UIKit/UIKit.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <CoreLocation/CoreLocation.h>
#import <netinet/in.h>

@implementation DeviceStatus

RCT_EXPORT_MODULE()

- (void)getDeviceInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    @try {
        // 1. Battery status
        UIDevice *device = [UIDevice currentDevice];
        BOOL wasBatteryMonitoringEnabled = device.isBatteryMonitoringEnabled;
        device.batteryMonitoringEnabled = YES;
        
        float batteryLevel = device.batteryLevel;
        double batteryPercentage = batteryLevel >= 0 ? (double)(batteryLevel * 100.0) : -1.0;
        
        // Restore battery monitoring state
        device.batteryMonitoringEnabled = wasBatteryMonitoringEnabled;
        
        // 2. Network Status
        NSString *networkStatus = [self getNetworkStatus];
        
        // 3. GPS Info
        CLLocationManager *locationManager = [[CLLocationManager alloc] init];
        CLLocation *location = locationManager.location;
        double latitude = 0.0;
        double longitude = 0.0;
        BOOL gpsAvailable = NO;
        
        if (location != nil) {
            latitude = location.coordinate.latitude;
            longitude = location.coordinate.longitude;
            gpsAvailable = YES;
        } else {
            CLAuthorizationStatus authStatus;
            #if __IPHONE_OS_VERSION_MIN_REQUIRED >= 140000
            authStatus = locationManager.authorizationStatus;
            #else
            authStatus = [CLLocationManager authorizationStatus];
            #endif
            if (authStatus == kCLAuthorizationStatusAuthorizedWhenInUse || authStatus == kCLAuthorizationStatusAuthorizedAlways) {
                gpsAvailable = YES;
            }
        }
        
        // 4. Device Name, Model and OS
        NSString *deviceName = device.name;
        NSString *deviceModel = device.model;
        NSString *osVersion = device.systemVersion;
        
        NSDictionary *deviceInfo = @{
            @"batteryPercentage": @(batteryPercentage),
            @"networkStatus": networkStatus,
            @"gpsLatitude": @(latitude),
            @"gpsLongitude": @(longitude),
            @"gpsAvailable": @(gpsAvailable),
            @"deviceName": deviceName ?: @"Unknown",
            @"deviceModel": deviceModel ?: @"Unknown",
            @"osVersion": osVersion ?: @"Unknown"
        };
        
        resolve(deviceInfo);
    } @catch (NSException *exception) {
        reject(@"DEVICE_INFO_ERROR", exception.reason, nil);
    }
}

- (NSString *)getNetworkStatus {
    struct sockaddr_in zeroAddress;
    bzero(&zeroAddress, sizeof(zeroAddress));
    zeroAddress.sin_len = sizeof(zeroAddress);
    zeroAddress.sin_family = AF_INET;
    
    SCNetworkReachabilityRef defaultRouteReachability = SCNetworkReachabilityCreateWithAddress(NULL, (const struct sockaddr *)&zeroAddress);
    SCNetworkReachabilityFlags flags;
    
    BOOL didRetrieveFlags = SCNetworkReachabilityGetFlags(defaultRouteReachability, &flags);
    CFRelease(defaultRouteReachability);
    
    if (!didRetrieveFlags) {
        return @"none";
    }
    
    BOOL isReachable = (flags & kSCNetworkFlagsReachable) != 0;
    BOOL needsConnection = (flags & kSCNetworkFlagsConnectionRequired) != 0;
    if (!isReachable || needsConnection) {
        return @"none";
    }
    
    #if TARGET_OS_IPHONE
    if (flags & kSCNetworkReachabilityFlagsIsWWAN) {
        return @"cellular";
    }
    #endif
    
    return @"wifi";
}

// Codegen requires this helper to load the module correctly
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeDeviceStatusSpecJSI>(params);
}

@end
