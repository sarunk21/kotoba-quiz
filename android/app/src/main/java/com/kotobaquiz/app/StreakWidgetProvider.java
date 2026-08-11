package com.kotobaquiz.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StreakWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "KotobaStreakPrefs";
    public static final String KEY_STREAK = "current_streak";
    public static final String KEY_LAST_DATE = "last_played_date";
    public static final String KEY_TODAY_DONE = "is_today_done";
    public static final String KEY_LONGEST_STREAK = "longest_streak";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widgetComponent = new ComponentName(context, StreakWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int streak = prefs.getInt(KEY_STREAK, 0);
        String lastDate = prefs.getString(KEY_LAST_DATE, "");
        boolean todayDone = prefs.getBoolean(KEY_TODAY_DONE, false);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String todayStr = sdf.format(new Date());
        boolean isDoneToday = todayDone || todayStr.equals(lastDate);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.streak_widget);

        // Update Streak Count
        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));

        // Update Icon & Status Text
        if (isDoneToday && streak > 0) {
            views.setTextViewText(R.id.widget_icon, "🔥");
            views.setTextViewText(R.id.widget_status_text, "✨ Apimu aman dan menyala hari ini!");
            views.setTextColor(R.id.widget_status_text, Color.parseColor("#34D399")); // Emerald 400
        } else if (streak > 0) {
            views.setTextViewText(R.id.widget_icon, "🔥");
            views.setTextViewText(R.id.widget_status_text, "⚠️ Selesaikan 1 kuis agar apimu tidak padam!");
            views.setTextColor(R.id.widget_status_text, Color.parseColor("#FBBF24")); // Amber 400
        } else {
            views.setTextViewText(R.id.widget_icon, "✨");
            views.setTextViewText(R.id.widget_status_text, "🎯 Mulai latihan hari ini untuk nyalakan streak!");
            views.setTextColor(R.id.widget_status_text, Color.parseColor("#94A3B8")); // Slate 400
        }

        // Set Click PendingIntent to open Kotoba Quiz MainActivity
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
