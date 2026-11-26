package com.restaurantpos.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.SystemClock;
import android.telephony.TelephonyManager;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Caller ID: tells the web app the number of an incoming call.
 *
 * Listens for the phone "ringing" broadcast while the app is running and
 * sends an "incomingCall" event ({ number }) to JavaScript.
 * Needs READ_PHONE_STATE + READ_CALL_LOG (Android only reveals the
 * number to apps that hold both).
 *
 * JavaScript side: client/src/lib/caller-id.ts
 */
@CapacitorPlugin(
    name = "CallerId",
    permissions = {
        @Permission(
            alias = "phone",
            strings = { Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG }
        )
    }
)
public class CallerIdPlugin extends Plugin {

    private BroadcastReceiver receiver;
    private String lastNumber;
    private long lastNotifiedAt;

    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                if (!TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
                    return;
                }
                // Android sends this broadcast twice; only one copy carries the number.
                String number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                if (number == null || number.isEmpty()) {
                    return;
                }
                long now = SystemClock.elapsedRealtime();
                if (number.equals(lastNumber) && now - lastNotifiedAt < 10_000) {
                    return;
                }
                lastNumber = number;
                lastNotifiedAt = now;

                JSObject data = new JSObject();
                data.put("number", number);
                // retainUntilConsumed: deliver it even if the page is still loading.
                notifyListeners("incomingCall", data, true);
            }
        };

        ContextCompat.registerReceiver(
            getContext(),
            receiver,
            new IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED),
            ContextCompat.RECEIVER_EXPORTED
        );
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            try {
                getContext().unregisterReceiver(receiver);
            } catch (IllegalArgumentException ignored) {
                // Already unregistered.
            }
            receiver = null;
        }
        super.handleOnDestroy();
    }
}
