import { Capacitor } from "@capacitor/core";

/** True inside the Android app, false in a normal web browser. */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** "android", "ios" or "web". */
export const getPlatform = (): string => Capacitor.getPlatform();
