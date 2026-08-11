package com.kotobaquiz.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreakWidgetPlugin")
public class StreakWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateStreak(PluginCall call) {
        try {
            int currentStreak = call.getInt("currentStreak", 0);
            String lastPlayedDate = call.getString("lastPlayedDate", "");
            boolean isTodayDone = call.getBoolean("isTodayDone", false);
            int longestStreak = call.getInt("longestStreak", 0);

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(StreakWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putInt(StreakWidgetProvider.KEY_STREAK, currentStreak);
            editor.putString(StreakWidgetProvider.KEY_LAST_DATE, lastPlayedDate);
            editor.putBoolean(StreakWidgetProvider.KEY_TODAY_DONE, isTodayDone);
            editor.putInt(StreakWidgetProvider.KEY_LONGEST_STREAK, longestStreak);
            editor.apply();

            // Refresh all active Android home screen widgets
            StreakWidgetProvider.updateAllWidgets(context);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to update streak widget: " + e.getMessage());
        }
    }
}
