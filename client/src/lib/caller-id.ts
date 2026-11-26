import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { isNativeApp } from "./platform";

export interface IncomingCall {
  number: string;
}

type PermissionState = "granted" | "denied" | "prompt" | "prompt-with-rationale";

interface CallerIdPlugin {
  checkPermissions(): Promise<{ phone: PermissionState }>;
  requestPermissions(): Promise<{ phone: PermissionState }>;
  addListener(event: "incomingCall", handler: (call: IncomingCall) => void): Promise<PluginListenerHandle>;
}

// Native side: android/app/src/main/java/com/restaurantpos/app/CallerIdPlugin.java
const CallerId = registerPlugin<CallerIdPlugin>("CallerId");

/**
 * Starts listening for incoming phone calls (Android app only).
 * Asks for the phone permission the first time. Returns a function that stops listening.
 * In a web browser this does nothing.
 */
export async function listenForIncomingCalls(
  onCall: (call: IncomingCall) => void,
  onPermissionDenied?: () => void,
): Promise<() => void> {
  if (!isNativeApp()) return () => {};

  let { phone } = await CallerId.checkPermissions();
  if (phone !== "granted") {
    ({ phone } = await CallerId.requestPermissions());
  }
  if (phone !== "granted") {
    onPermissionDenied?.();
    return () => {};
  }

  const handle = await CallerId.addListener("incomingCall", onCall);
  return () => {
    handle.remove();
  };
}
