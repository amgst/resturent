import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { BarChart3, ChefHat, PhoneIncoming, UtensilsCrossed } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandTheme } from "@/components/brand-theme";
import { useRestaurantSettings } from "@/hooks/use-settings";

function friendlyError(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/user-disabled":
      return "This account has been disabled. Ask the owner or manager.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, or reset your password.";
    case "auth/network-request-failed":
      return "No internet connection. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email sign-in isn't turned on in Firebase yet.";
    default:
      return "Couldn't sign in. Please try again.";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: brand } = useRestaurantSettings(null);
  const restaurantName = brand?.restaurantName || "Restaurant Manager";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AuthProvider sees the new user and shows the app.
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Type your email above first, then tap \"Forgot password\".");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("If that email has an account, a reset link is on its way. Check your inbox.");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandTheme settings={brand} />

      {/* Brand panel (large screens) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10" aria-hidden />
        <div className="relative flex items-center gap-3">
          {brand?.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-12 w-12 rounded-lg bg-white object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
          )}
          <span className="text-xl font-semibold">{restaurantName}</span>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Orders, tables and regulars.
            <br />
            All in one place.
          </h2>
          <ul className="space-y-3 text-primary-foreground/90">
            {[
              [PhoneIncoming, "Know who's calling before you answer"],
              [ChefHat, "Send orders straight to the kitchen"],
              [BarChart3, "See today's sales at a glance"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof PhoneIncoming;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <I className="h-4 w-4" />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">{brand?.tagline || "Restaurant management"}</p>
      </div>

      {/* Sign-in form */}
      <div className="flex items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to {restaurantName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={handleReset}
                  data-testid="button-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {notice && <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{notice}</p>}

            <Button type="submit" className="h-11 w-full text-base" disabled={busy} data-testid="button-sign-in">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Staff accounts are created by the owner or manager.
          </p>
        </div>
      </div>
    </div>
  );
}
