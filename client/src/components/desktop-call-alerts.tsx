import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { Bell, BellOff, BellRing } from "lucide-react";
import type { Customer, OrderWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { isNativeApp } from "@/lib/platform";
import { useCaller } from "@/hooks/use-caller";
import { useLocationStore } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";

const PREF_KEY = "desktop-call-alerts";

type Permission = NotificationPermission | "unsupported";

const currentPermission = (): Permission =>
  typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";

let audioContext: AudioContext | null = null;

/** Short two-tone "ring" made with Web Audio, so no sound file is needed. */
function playChime() {
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    const start = ctx.currentTime;
    [0, 0.45].forEach((offset) => {
      [880, 1175].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = start + offset + i * 0.16;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      });
    });
  } catch {
    // Sound is a nice-to-have; ignore browsers that block it.
  }
}

async function describeCaller(phone: string): Promise<{ title: string; body: string }> {
  try {
    const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(phone)}`);
    if (res.ok) {
      const { customer, orders } = (await res.json()) as { customer: Customer | null; orders: OrderWithItems[] };
      if (customer) {
        const lines = [
          [phone, ...(customer.tags ?? [])].join(" · "),
          customer.allergies ? `⚠ Allergy: ${customer.allergies}` : "",
          orders[0]
            ? `Last order: ${orders[0].items.map((i) => `${i.quantity}× ${i.menuItem?.name ?? "item"}`).join(", ")}`
            : "",
        ].filter(Boolean);
        return { title: `📞 ${customer.name} is calling`, body: lines.join("\n") };
      }
    }
  } catch {
    // Fall through to the plain version.
  }
  return { title: "📞 Incoming call", body: `${phone} · New caller` };
}

/**
 * Desktop/web only: listens for calls logged by the Android app and shows the
 * caller pop-up, a chime and a system notification on this computer.
 * Renders the bell button that turns alerts on/off.
 */
export function DesktopCallAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showCaller } = useCaller();
  const { selectedLocationId } = useLocationStore();
  const [permission, setPermission] = useState<Permission>(currentPermission);
  const [enabled, setEnabled] = useState(() => localStorage.getItem(PREF_KEY) !== "off");
  const locationRef = useRef(selectedLocationId);
  const enabledRef = useRef(enabled);
  locationRef.current = selectedLocationId;
  enabledRef.current = enabled;

  useEffect(() => {
    // The Android app gets calls directly from the phone; don't double up there.
    if (isNativeApp() || !user) return;

    const seen = new Set<string>();
    let firstSnapshot = true;
    // Look back a minute to tolerate clock differences; the first snapshot is skipped below.
    const since = Timestamp.fromMillis(Date.now() - 60_000);
    const callsQuery = query(collection(firestore, "callLogs"), where("createdAt", ">", since));

    return onSnapshot(
      callsQuery,
      (snapshot) => {
        const changes = snapshot.docChanges();
        if (firstSnapshot) {
          firstSnapshot = false;
          changes.forEach((c) => seen.add(c.doc.id));
          return;
        }
        for (const change of changes) {
          if (change.type !== "added" || seen.has(change.doc.id)) continue;
          seen.add(change.doc.id);
          const call = change.doc.data() as { phone: string; locationId: string | null };
          const location = locationRef.current;
          if (call.locationId && location && call.locationId !== location) continue;
          if (!enabledRef.current) continue;

          showCaller(call.phone, { incoming: true, callLogId: change.doc.id });
          playChime();

          if (currentPermission() === "granted") {
            describeCaller(call.phone).then(({ title, body }) => {
              const notification = new Notification(title, {
                body,
                tag: change.doc.id,
                requireInteraction: true,
                icon: "/favicon.png",
              });
              notification.onclick = () => {
                window.focus();
                showCaller(call.phone, { incoming: true, callLogId: change.doc.id });
                notification.close();
              };
            });
          }
        }
      },
      (error) => {
        console.warn("Live call alerts unavailable:", error);
        if (error.code === "permission-denied") {
          toast({
            title: "Desktop call alerts are off",
            description: "Firestore rules need updating. See firestore.rules in the project.",
          });
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (isNativeApp()) return null;

  const toggle = async () => {
    // A click is required before browsers allow notifications and sound.
    audioContext ??= new AudioContext();
    await audioContext.resume().catch(() => {});

    if (enabled && permission === "granted") {
      setEnabled(false);
      localStorage.setItem(PREF_KEY, "off");
      toast({ title: "Call alerts off", description: "This computer won't alert you about incoming calls." });
      return;
    }

    let next = currentPermission();
    if (next === "default") {
      next = await Notification.requestPermission();
    }
    setPermission(next);
    setEnabled(true);
    localStorage.setItem(PREF_KEY, "on");

    if (next === "granted") {
      playChime();
      toast({ title: "Call alerts on", description: "You'll get a pop-up and a notification when the restaurant phone rings." });
    } else if (next === "denied") {
      toast({
        title: "Notifications are blocked",
        description: "Click the lock icon next to the web address, allow Notifications, then try again. Pop-ups in the app still work.",
      });
    } else if (next === "unsupported") {
      toast({ title: "Pop-ups only", description: "This browser doesn't support desktop notifications." });
    }
  };

  const active = enabled && permission === "granted";
  const Icon = active ? BellRing : enabled ? Bell : BellOff;
  const label = active
    ? "Call alerts on (click to turn off)"
    : enabled
      ? "Turn on desktop notifications for calls"
      : "Call alerts off (click to turn on)";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={active}
      data-testid="button-call-alerts"
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
    </Button>
  );
}
