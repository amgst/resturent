import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, MapPin, Phone, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { Location, MenuCategory, MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandTheme } from "@/components/brand-theme";
import { useRestaurantSettings } from "@/hooks/use-settings";

/**
 * Public storefront website for a restaurant: /store  (or /store?location=<id>).
 * Built from the saved branding (Settings), menu and location details.
 */
export default function Store() {
  const urlLocationId = new URLSearchParams(window.location.search).get("location");

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  const { data: categories = [] } = useQuery<MenuCategory[]>({ queryKey: ["/api/menu-categories"] });
  const { data: items = [], isLoading: menuLoading } = useQuery<MenuItem[]>({ queryKey: ["/api/menu-items"] });

  const location = locations.find((l) => l.id === urlLocationId) ?? locations.find((l) => l.active) ?? locations[0];
  const { data: brand } = useRestaurantSettings(location?.id ?? urlLocationId);

  const name = brand?.restaurantName || location?.name || "Our Restaurant";
  const tagline = brand?.tagline || "Fresh food, made to order.";
  const currency = brand?.currency || "AUD";
  const money = (value: string) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(parseFloat(value) || 0);

  const available = useMemo(() => items.filter((i) => i.available), [items]);
  const menuByCategory = useMemo(
    () =>
      categories
        .map((category) => ({ category, items: available.filter((i) => i.categoryId === category.id) }))
        .filter((group) => group.items.length > 0),
    [categories, available],
  );
  // One highlight from each category (pictured ones first).
  const favourites = useMemo(
    () =>
      menuByCategory
        .map((g) => g.items.find((i) => i.imageUrl) ?? g.items[0])
        .filter(Boolean)
        .slice(0, 6),
    [menuByCategory],
  );
  const heroImage = favourites.find((i) => i.imageUrl)?.imageUrl;

  const orderUrl = `/customer-menu${location ? `?location=${location.id}` : ""}`;
  const telUrl = location?.phone ? `tel:${location.phone.replace(/\s/g, "")}` : null;
  const mapsQuery = location ? encodeURIComponent(`${name}, ${location.address}`) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BrandTheme settings={brand} />

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            {brand?.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
            )}
            <span className="truncate text-lg font-bold" data-testid="text-store-name">{name}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#favourites" className="text-muted-foreground hover:text-foreground">Favourites</a>
            <a href="#menu" className="text-muted-foreground hover:text-foreground">Menu</a>
            <a href="#visit" className="text-muted-foreground hover:text-foreground">Visit us</a>
          </nav>
          <Button asChild data-testid="link-order-online-top">
            <a href={orderUrl}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Order online
            </a>
          </Button>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-black/10" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            {location && (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                <MapPin className="h-4 w-4" /> {location.address}
              </p>
            )}
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{name}</h1>
            <p className="max-w-lg text-lg text-primary-foreground/90 md:text-xl">{tagline}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="text-base" data-testid="link-order-online">
                <a href={orderUrl}>
                  Order online <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {telUrl && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/60 bg-transparent text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  data-testid="link-call-store"
                >
                  <a href={telUrl}>
                    <Phone className="mr-2 h-4 w-4" /> Call {location?.phone}
                  </a>
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            {heroImage ? (
              <img
                src={heroImage}
                alt=""
                className="aspect-[4/3] w-full max-w-md rounded-3xl object-cover shadow-2xl ring-8 ring-white/15"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-3xl bg-white/10">
                <UtensilsCrossed className="h-20 w-20 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick info ────────────────────────────────────────── */}
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          <InfoTile icon={ShoppingBag} title="Order online" text="Choose from the full menu and skip the queue." href={orderUrl} />
          <InfoTile
            icon={Phone}
            title="Call to order"
            text={location?.phone ? `Ring us on ${location.phone}.` : "Call us to place an order."}
            href={telUrl ?? undefined}
          />
          <InfoTile
            icon={MapPin}
            title="Visit us"
            text={location?.address ?? "Find us on the map below."}
            href="#visit"
          />
        </div>
      </section>

      {/* ── Favourites ────────────────────────────────────────── */}
      <section id="favourites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <SectionTitle eyebrow="Customer favourites" title="Something for everyone" />
        {menuLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : favourites.length === 0 ? (
          <p className="text-muted-foreground">Our menu is coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                    <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="shrink-0 font-semibold text-primary">{money(item.price)}</span>
                  </div>
                  {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Full menu ─────────────────────────────────────────── */}
      <section id="menu" className="scroll-mt-20 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle eyebrow="The menu" title="Made fresh, every order" />
          <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
            {menuByCategory.map(({ category, items: group }) => (
              <div key={category.id}>
                <h3 className="mb-4 border-b pb-2 text-xl font-bold">{category.name}</h3>
                <ul className="space-y-4">
                  {group.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="flex-1 border-b border-dotted border-muted-foreground/40" aria-hidden />
                          <span className="font-semibold">{money(item.price)}</span>
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <a href={orderUrl}>
                <ShoppingBag className="mr-2 h-4 w-4" /> Order from the menu
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Visit us ──────────────────────────────────────────── */}
      <section id="visit" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <SectionTitle eyebrow="Visit us" title="Come say hello" />
        {locationsLoading ? (
          <Skeleton className="h-80" />
        ) : location ? (
          <div className="grid gap-8 md:grid-cols-5">
            <div className="space-y-5 md:col-span-2">
              <InfoLine icon={MapPin} label="Address" value={location.address} />
              {location.phone && <InfoLine icon={Phone} label="Phone" value={location.phone} href={telUrl ?? undefined} />}
              <Button asChild variant="outline">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`} target="_blank" rel="noreferrer">
                  Get directions <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border md:col-span-3">
              <iframe
                title={`Map of ${name}`}
                src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                className="h-80 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Location details coming soon.</p>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {name}
          </p>
          <a href="/" className="hover:text-foreground">
            Staff login
          </a>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
    </div>
  );
}

function InfoTile({ icon: Icon, title, text, href }: { icon: typeof Phone; title: string; text: string; href?: string }) {
  const body = (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="rounded-xl p-2 transition-colors hover:bg-muted/60">
      {body}
    </a>
  ) : (
    <div className="p-2">{body}</div>
  );
}

function InfoLine({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="font-medium hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}
