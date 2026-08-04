package com.studiorad.tarefaswhatsapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class NotificationActionReceiver extends BroadcastReceiver {
    public static final String ACTION_OPEN_TODAY = "com.studiorad.tarefaswhatsapp.OPEN_TODAY";
    public static final String ACTION_OPEN_LATE = "com.studiorad.tarefaswhatsapp.OPEN_LATE";
    public static final String ACTION_REFRESH = "com.studiorad.tarefaswhatsapp.REFRESH_STATUS";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : "";

        if (ACTION_REFRESH.equals(action)) {
            NotificationScheduler.showStatusNotification(context);
            return;
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        if (ACTION_OPEN_TODAY.equals(action)) {
            openApp.putExtra("open_section", "hoje");
        } else if (ACTION_OPEN_LATE.equals(action)) {
            openApp.putExtra("open_section", "atrasadas");
        }

        context.startActivity(openApp);
    }
}
