Pod::Spec.new do |s|
  s.name         = "AppNativeModules"
  s.version      = "0.0.1"
  s.summary      = "Local Native Modules for OfflineCityExplorer"
  s.homepage     = "https://github.com/offlinecityexplorer"
  s.license      = "UNLICENSED"
  s.authors      = { "Jigar Solanki" => "jigar@example.com" }
  s.source       = { :git => "" }
  s.platforms    = { :ios => "15.1" }
  s.source_files = "OfflineCityExplorer/{DeviceStatus,SortEngine}.{h,mm}"
  s.frameworks   = "SystemConfiguration", "CoreLocation"
  
  s.dependency "React-Core"
  
  install_modules_dependencies(s)
end
