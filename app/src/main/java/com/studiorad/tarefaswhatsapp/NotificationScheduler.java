package com.studiorad.tarefaswhatsapp;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;

public class NotificationScheduler {
    public static final String CHANNEL_ID = "tarefas_diarias";
    private static final String PREFS = "tarefas_notificacoes";
    private static final int REQUEST_CODE = 7027;

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Relatorio diario de tarefas", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Relatorio diario com atrasos, prioridades e pagamentos pendentes.");
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    public static void saveReport(Context context, String report, String time) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putString("report", report == null || report.trim().isEmpty() ? "Nenhuma tarefa cadastrada." : report)
                .putString("time", time == null || time.trim().isEmpty() ? "07:00" : time)
                .apply();
    }

    public static void scheduleDaily(Context context, String time) {
        String selectedTime = time == null || time.trim().isEmpty() ? "07:00" : time;
        String[] parts = selectedTime.split(":");
        int hour = 7;
        int minute = 0;
        try {
            hour = Integer.parseInt(parts[0]);
            minute = Integer.parseInt(parts[1]);
        } catch (Exception ignored) {}

        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) calendar.add(Calendar.DAY_OF_YEAR, 1);

        Intent intent = new Intent(context, TaskNotificationReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        alarmManager.cancel(pendingIntent);
        long triggerAt = calendar.getTimeInMillis();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        }
    }

    public static String getReport(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("report", "Abra o app para atualizar seu relatorio de tarefas.");
    }

    public static String getTime(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("time", "07:00");
    }
}
