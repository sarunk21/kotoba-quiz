package com.kotobaquiz.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
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
            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            updateAppWidget(context, appWidgetManager, appWidgetId, options);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        updateAppWidget(context, appWidgetManager, appWidgetId, newOptions);
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widgetComponent = new ComponentName(context, StreakWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            for (int appWidgetId : appWidgetIds) {
                Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
                updateAppWidget(context, appWidgetManager, appWidgetId, options);
            }
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle options) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int streak = prefs.getInt(KEY_STREAK, 0);
        String lastDate = prefs.getString(KEY_LAST_DATE, "");
        boolean todayDone = prefs.getBoolean(KEY_TODAY_DONE, false);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String todayStr = sdf.format(new Date());
        boolean isDoneToday = todayDone || todayStr.equals(lastDate);

        // Determine widget width
        int minWidth = 250;
        if (options != null) {
            minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
        }

        boolean isCompact = minWidth > 0 && minWidth < 210;
        int layoutId = isCompact ? R.layout.streak_widget_small : R.layout.streak_widget_wide;

        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        // Update Streak Count Text
        if (isCompact) {
            views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
            views.setTextViewText(R.id.widget_streak_unit, "HARI STREAK");
        } else {
            views.setTextViewText(R.id.widget_streak_count, streak + " Hari Beruntun");
        }

        // Status Badge & Text Styling
        if (isDoneToday && streak > 0) {
            views.setTextViewText(R.id.widget_badge, isCompact ? "✨ AMAN" : "✨ AKTIF HARI INI");
            views.setTextColor(R.id.widget_badge, Color.parseColor("#34D399"));
            views.setInt(R.id.widget_badge, "setBackgroundResource", R.drawable.widget_badge_green);

            if (!isCompact) {
                views.setTextViewText(R.id.widget_status_text, "✨ Apimu aman dan menyala hari ini!");
                views.setTextColor(R.id.widget_status_text, Color.parseColor("#34D399"));
            }
        } else if (streak > 0) {
            views.setTextViewText(R.id.widget_badge, isCompact ? "⚠️ LATIHAN" : "⚠️ PERLU LATIHAN");
            views.setTextColor(R.id.widget_badge, Color.parseColor("#F97316"));
            views.setInt(R.id.widget_badge, "setBackgroundResource", R.drawable.widget_badge_orange);

            if (!isCompact) {
                views.setTextViewText(R.id.widget_status_text, "⚠️ Selesaikan 1 kuis agar apimu tidak padam!");
                views.setTextColor(R.id.widget_status_text, Color.parseColor("#FBBF24"));
            }
        } else {
            views.setTextViewText(R.id.widget_badge, isCompact ? "🎯 MULAI" : "🎯 MULAI STREAK");
            views.setTextColor(R.id.widget_badge, Color.parseColor("#94A3B8"));
            views.setInt(R.id.widget_badge, "setBackgroundResource", R.drawable.widget_badge_orange);

            if (!isCompact) {
                views.setTextViewText(R.id.widget_status_text, "🎯 Mulai latihan hari ini untuk nyalakan streak!");
                views.setTextColor(R.id.widget_status_text, Color.parseColor("#94A3B8"));
            }
        }

        // Compute 7-Day Weekly Dot Tracker (Monday to Sunday) for Wide Layout
        if (!isCompact) {
            int[] dayViewIds = new int[]{
                    R.id.widget_day_0, // Sen
                    R.id.widget_day_1, // Sel
                    R.id.widget_day_2, // Rab
                    R.id.widget_day_3, // Kam
                    R.id.widget_day_4, // Jum
                    R.id.widget_day_5, // Sab
                    R.id.widget_day_6  // Min
            };

            boolean[] activeDays = calculateWeeklyActiveDays(streak, lastDate, isDoneToday);
            int todayIndex = getMondayBasedTodayIndex();

            for (int i = 0; i < 7; i++) {
                int viewId = dayViewIds[i];
                if (activeDays[i]) {
                    views.setInt(viewId, "setBackgroundResource", R.drawable.widget_day_active);
                    views.setTextViewText(viewId, "✓");
                    views.setTextColor(viewId, Color.parseColor("#FFFFFF"));
                } else if (i == todayIndex) {
                    views.setInt(viewId, "setBackgroundResource", R.drawable.widget_day_today);
                    views.setTextViewText(viewId, "•");
                    views.setTextColor(viewId, Color.parseColor("#F97316"));
                } else {
                    views.setInt(viewId, "setBackgroundResource", R.drawable.widget_day_inactive);
                    views.setTextViewText(viewId, "○");
                    views.setTextColor(viewId, Color.parseColor("#71717A"));
                }
            }
        }

        // PendingIntent to launch app on widget tap
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

    private static int getMondayBasedTodayIndex() {
        Calendar cal = Calendar.getInstance();
        int dow = cal.get(Calendar.DAY_OF_WEEK); // Sunday = 1, Monday = 2
        return (dow == Calendar.SUNDAY) ? 6 : (dow - 2);
    }

    private static boolean[] calculateWeeklyActiveDays(int streak, String lastDate, boolean isDoneToday) {
        boolean[] active = new boolean[7];
        if (streak <= 0 || lastDate == null || lastDate.isEmpty()) {
            return active;
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date lastPlayed = sdf.parse(lastDate);
            Date today = new Date();
            String todayStr = sdf.format(today);
            Date todayDate = sdf.parse(todayStr);

            if (lastPlayed == null || todayDate == null) return active;

            long diffMillis = todayDate.getTime() - lastPlayed.getTime();
            long diffDays = diffMillis / (1000 * 60 * 60 * 24);

            // Valid streak condition (played today or yesterday)
            if (diffDays <= 1) {
                int todayMonIndex = getMondayBasedTodayIndex();

                Calendar startOfWeek = Calendar.getInstance();
                startOfWeek.setTime(todayDate);
                startOfWeek.add(Calendar.DAY_OF_MONTH, -todayMonIndex);
                startOfWeek.set(Calendar.HOUR_OF_DAY, 0);
                startOfWeek.set(Calendar.MINUTE, 0);
                startOfWeek.set(Calendar.SECOND, 0);
                startOfWeek.set(Calendar.MILLISECOND, 0);

                for (int i = 0; i < streak; i++) {
                    Calendar d = Calendar.getInstance();
                    d.setTime(lastPlayed);
                    d.add(Calendar.DAY_OF_MONTH, -i);

                    if (d.compareTo(startOfWeek) >= 0 && d.getTimeInMillis() <= todayDate.getTime() + 86400000L) {
                        int dow = d.get(Calendar.DAY_OF_WEEK);
                        int monIdx = (dow == Calendar.SUNDAY) ? 6 : (dow - 2);
                        if (monIdx >= 0 && monIdx < 7) {
                            active[monIdx] = true;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return active;
    }
}
