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

public class SingleTaskReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationScheduler.ensureChannel(context);
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

        String title = intent != null ? intent.getStringExtra("title") : "Tarefa";
        String detail = intent != null ? intent.getStringExtra("detail") : "Lembrete de tarefa";

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 41, openApp, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.BigTextStyle style = new NotificationCompat.BigTextStyle()
                .bigText(detail)
                .setBigContentTitle(title == null ? "Tarefa" : title);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, NotificationScheduler.TASK_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title == null ? "Tarefa" : title)
                .setContentText(detail == null ? "Lembrete de tarefa" : detail)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify((int)(System.currentTimeMillis() % 100000), builder.build());

        NotificationScheduler.showStatusNotification(context);
    }
}
