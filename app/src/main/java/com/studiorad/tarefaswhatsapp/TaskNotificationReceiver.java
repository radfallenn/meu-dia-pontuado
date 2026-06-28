package com.studiorad.tarefaswhatsapp;

import android.Manifest;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class TaskNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationScheduler.ensureChannel(context);
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

        String report = NotificationScheduler.getReport(context);
        String summary = buildSummary(report);

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 0, openApp, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.BigTextStyle style = new NotificationCompat.BigTextStyle()
                .bigText(report)
                .setBigContentTitle("Relatorio diario de tarefas")
                .setSummaryText("Toque para abrir o app");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, NotificationScheduler.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Relatorio diario de tarefas")
                .setContentText(summary)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(7028, builder.build());
        NotificationScheduler.scheduleDaily(context, NotificationScheduler.getTime(context));
    }

    private String buildSummary(String report) {
        if (report == null || report.trim().isEmpty()) return "Abra o app para ver suas tarefas.";
        String[] lines = report.split("\\n");
        for (String line : lines) {
            if (line.contains("Atrasadas") || line.contains("Para hoje") || line.contains("Pagamento pendente")) {
                return line.replace("🚨", "").replace("📅", "").replace("💰", "").trim();
            }
        }
        return "Toque para ver prioridades, atrasos e pagamentos.";
    }
}
