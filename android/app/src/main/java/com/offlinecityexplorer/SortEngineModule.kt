package com.offlinecityexplorer

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.Arguments
import java.util.Collections
import java.util.ArrayList
import com.offlinecityexplorer.NativeSortEngineSpec

class SortEngineModule(reactContext: ReactApplicationContext) : NativeSortEngineSpec(reactContext) {

    override fun getName(): String {
        return NAME
    }

    override fun sortCities(cities: ReadableArray?): WritableArray {
        if (cities == null) {
            return Arguments.createArray()
        }
        val size = cities.size()
        val list = ArrayList<String>(size)
        for (i in 0 until size) {
            val str = cities.getString(i)
            if (str != null) {
                list.add(str)
            }
        }

        // Optimized Java/JVM sort (Timsort)
        Collections.sort(list)

        val result = Arguments.createArray()
        for (str in list) {
            result.pushString(str)
        }
        return result
    }

    companion object {
        const val NAME = "SortEngine"
    }
}
