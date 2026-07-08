package com.offlinecityexplorer

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.os.Build
import android.os.BatteryManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.location.LocationManager
import android.location.Location
import android.provider.Settings
import com.offlinecityexplorer.NativeDeviceStatusSpec

class DeviceStatusModule(reactContext: ReactApplicationContext) : NativeDeviceStatusSpec(reactContext) {

    override fun getName(): String {
        return NAME
    }

    override fun getDeviceInfo(promise: Promise) {
        try {
            val context = reactApplicationContext

            // 1. Battery Percentage
            var batteryPercentage = -1.0
            val batteryStatus: Intent? = context.registerReceiver(
                null,
                IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            )
            if (batteryStatus != null) {
                val level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                if (level != -1 && scale != -1) {
                    batteryPercentage = (level.toFloat() / scale.toFloat() * 100.0).toDouble()
                }
            }

            // 2. Network Status
            var networkStatus = "none"
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            if (cm != null) {
                val activeNetwork = cm.activeNetwork
                val capabilities = cm.getNetworkCapabilities(activeNetwork)
                if (capabilities != null) {
                    if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        networkStatus = "wifi"
                    } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        networkStatus = "cellular"
                    } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                        networkStatus = "ethernet"
                    }
                }
            }

            // 3. GPS Coordinates
            var gpsAvailable = false
            var gpsLatitude = 0.0
            var gpsLongitude = 0.0

            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            if (lm != null) {
                val isGpsEnabled = lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
                val isNetworkEnabled = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
                
                if (isGpsEnabled || isNetworkEnabled) {
                    gpsAvailable = true
                    var lastLocation: Location? = null
                    try {
                        if (isGpsEnabled) {
                            lastLocation = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                        }
                        if (lastLocation == null && isNetworkEnabled) {
                            lastLocation = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                        }
                    } catch (e: SecurityException) {
                        // Permission denied
                        gpsAvailable = false
                    }

                    if (lastLocation != null) {
                        gpsLatitude = lastLocation.latitude
                        gpsLongitude = lastLocation.longitude
                    }
                }
            }

            // 4. Device Name
            var deviceName = Build.MODEL
            try {
                val userDeviceName = Settings.Global.getString(context.contentResolver, "device_name")
                if (!userDeviceName.isNullOrEmpty()) {
                    deviceName = userDeviceName
                }
            } catch (e: Exception) {
                // Ignore, fallback to Build.MODEL
            }

            // 5. Device Model & OS
            val deviceModel = Build.MODEL
            val osVersion = Build.VERSION.RELEASE

            // Create result map
            val result: WritableMap = Arguments.createMap().apply {
                putDouble("batteryPercentage", batteryPercentage)
                putString("networkStatus", networkStatus)
                putDouble("gpsLatitude", gpsLatitude)
                putDouble("gpsLongitude", gpsLongitude)
                putBoolean("gpsAvailable", gpsAvailable)
                putString("deviceName", deviceName)
                putString("deviceModel", deviceModel)
                putString("osVersion", osVersion)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.message, e)
        }
    }

    companion object {
        const val NAME = "DeviceStatus"
    }
}
