package com.studiorad.tarefaswhatsapp;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;

public class NotificationScheduler {
    public static final String CHANNEL_ID = "tarefas_diarias";
    public static final String STATUS_CHANNEL_ID = "tarefas_status";
    public static final String TASK_CHANNEL_ID = "tarefas_horario";
    private static final String PREFS = "tarefas_notificacoes";
    private static final int REQUEST_CODE = 7027;
    private static final int STATUS_ID = 7030;

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Relatorio diario de tarefas", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Relatorio diario com atrasos, prioridades e pagamentos pendentes.");

            NotificationChannel statusChannel = new NotificationChannel(STATUS_CHANNEL_ID, "Status permanente de tarefas", NotificationManager.IMPORTANCE_DEFAULT);
            statusChannel.setDescription("Resumo sempre visivel de tarefas atrasadas e tarefas do dia.");
            statusChannel.setShowBadge(true);

            NotificationChannel taskChannel = new NotificationChannel(TASK_CHANNEL_ID, "Lembretes por tarefa", NotificationManager.IMPORTANCE_HIGH);
            taskChannel.setDescription("Notificacoes no horario especifico de cada tarefa.");

            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                manager.createNotificationChannel(statusChannel);
                manager.createNotificationChannel(taskChannel);
            }
        }
    }

    public static void saveReport(Context context, String report, String time) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putString("report", report == null || report.trim().isEmpty() ? "Nenhuma tarefa cadastrada." : report)
                .putString("time", time == null || time.trim().isEmpty() ? "07:00" : time)
                .apply();
    }

    public static void saveStatus(Context context, String summary, String detail) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putString("status_summary", summary == null || summary.trim().isEmpty() ? "Sem tarefas urgentes." : summary)
                .putString("status_detail", detail == null || detail.trim().isEmpty() ? "Abra o app para ver suas tarefas." : detail)
                .apply();
    }

    public static String getStatusSummary(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("status_summary", "Sem tarefas urgentes.");
    }

    public static String getStatusDetail(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("status_detail", "Abra o app para ver suas tarefas.");
    }

    public static void showStatusNotification(Context context) {
        ensureChannel(context);
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

        String summary = getStatusSummary(context);
        String detail = getStatusDetail(context);

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 1, openApp, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent todayIntent = new Intent(context, NotificationActionReceiver.class);
        todayIntent.setAction(NotificationActionReceiver.ACTION_OPEN_TODAY);
        PendingIntent todayPending = PendingIntent.getBroadcast(context, 31, todayIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent lateIntent = new Intent(context, NotificationActionReceiver.class);
        lateIntent.setAction(NotificationActionReceiver.ACTION_OPEN_LATE);
        PendingIntent latePending = PendingIntent.getBroadcast(context, 32, lateIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent refreshIntent = new Intent(context, NotificationActionReceiver.class);
        refreshIntent.setAction(NotificationActionReceiver.ACTION_REFRESH);
        PendingIntent refreshPending = PendingIntent.getBroadcast(context, 33, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.BigTextStyle style = new NotificationCompat.BigTextStyle()
                .bigText(detail)
                .setBigContentTitle("Tarefas atrasadas e de hoje")
                .setSummaryText("Resumo fixo");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, STATUS_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Tarefas atrasadas e de hoje")
                .setContentText(summary)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setContentIntent(contentIntent)
                .addAction(android.R.drawable.ic_menu_today, "Hoje", todayPending)
                .addAction(android.R.drawable.ic_menu_recent_history, "Atrasadas", latePending)
                .addAction(android.R.drawable.ic_popup_sync, "Atualizar", refreshPending);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(STATUS_ID, builder.build());
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
        scheduleExact(context, calendar.getTimeInMillis(), pendingIntent);
    }

    public static void scheduleTaskReminder(Context context, String title, String detail, String date, String time, String taskId) {
        if (date == null || date.trim().isEmpty() || time == null || time.trim().isEmpty()) return;
        try {
            String[] d = date.split("-");
            String[] t = time.split(":");
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.YEAR, Integer.parseInt(d[0]));
            calendar.set(Calendar.MONTH, Integer.parseInt(d[1]) - 1);
            calendar.set(Calendar.DAY_OF_MONTH, Integer.parseInt(d[2]));
            calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(t[0]));
            calendar.set(Calendar.MINUTE, Integer.parseInt(t[1]));
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);

            if (calendar.getTimeInMillis() <= System.currentTimeMillis()) return;

            Intent intent = new Intent(context, SingleTaskReminderReceiver.class);
            intent.putExtra("title", title == null ? "Tarefa" : title);
            intent.putExtra("detail", detail == null ? "Lembrete de tarefa" : detail);
            intent.putExtra("taskId", taskId == null ? "" : taskId);

            int requestCode = Math.abs((taskId == null ? title : taskId).hashCode());
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            scheduleExact(context, calendar.getTimeInMillis(), pendingIntent);
        } catch (Exception ignored) {}
    }

    private static void scheduleExact(Context context, long triggerAt, PendingIntent pendingIntent) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        alarmManager.cancel(pendingIntent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            else alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
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
