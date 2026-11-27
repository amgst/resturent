import { randomUUID } from "crypto";

/**
 * Builds a complete demo pizzeria ("Bella Napoli", Newtown, Sydney):
 * menu with pictures, tables, staff, customers, a month of orders,
 * reservations and call history. Every record carries `demo: true`
 * so it can be removed again without touching real data.
 */

export type DemoRow = Record<string, unknown> & { id: string; demo: true };
export type DemoData = Record<string, DemoRow[]>;

/** Seeded random numbers so the demo looks the same every time it's loaded. */
function createRandom(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
  };
}

const row = (fields: Record<string, unknown>): DemoRow => ({ id: randomUUID(), demo: true, ...fields });
const money = (n: number) => n.toFixed(2);

const CATEGORIES = ["Classic Pizzas", "Gourmet Pizzas", "Sides", "Salads", "Desserts", "Drinks"] as const;

const MENU: Array<[category: (typeof CATEGORIES)[number], name: string, price: number, image: string, description: string, weight: number]> = [
  ["Classic Pizzas", "Margherita", 18.9, "margherita", "San Marzano tomato, fior di latte, fresh basil, extra virgin olive oil.", 10],
  ["Classic Pizzas", "Pepperoni", 21.9, "pepperoni", "Tomato, mozzarella and spicy pepperoni.", 12],
  ["Classic Pizzas", "Hawaiian", 21.9, "hawaiian", "Tomato, mozzarella, leg ham and pineapple.", 7],
  ["Classic Pizzas", "Capricciosa", 23.9, "capricciosa", "Tomato, mozzarella, ham, mushrooms and Kalamata olives.", 6],
  ["Classic Pizzas", "Vegetarian", 22.9, "vegetarian", "Tomato, mozzarella, capsicum, mushroom, red onion and olives.", 5],
  ["Classic Pizzas", "Meat Lovers", 25.9, "meat-lovers", "BBQ base, pepperoni, ham, bacon and Italian sausage.", 8],
  ["Gourmet Pizzas", "BBQ Chicken & Bacon", 25.9, "bbq-chicken", "Smoky BBQ base, roast chicken, bacon and red onion.", 7],
  ["Gourmet Pizzas", "Garlic Prawn & Chilli", 27.9, "prawn-chilli", "Garlic prawns, fresh chilli, baby spinach and lemon.", 4],
  ["Gourmet Pizzas", "Pumpkin, Feta & Spinach", 24.9, "pumpkin-feta", "Roast pumpkin, Persian feta, spinach on a white base.", 4],
  ["Gourmet Pizzas", "Supreme", 26.9, "supreme", "Pepperoni, sausage, capsicum, mushroom, onion and olives.", 6],
  ["Gourmet Pizzas", "Truffle Mushroom", 27.9, "truffle-mushroom", "Wild mushrooms, truffle oil, thyme and parmesan.", 3],
  ["Sides", "Garlic Bread", 8.5, "garlic-bread", "Wood-fired bread with garlic butter and parsley.", 8],
  ["Sides", "Cheesy Garlic Bread", 10.5, "cheesy-garlic-bread", "Garlic bread topped with melted mozzarella.", 6],
  ["Sides", "Chicken Wings (8)", 14.9, "wings", "Crispy wings with your choice of buffalo or honey soy.", 6],
  ["Sides", "Chips with Aioli", 8.9, "chips", "Thick-cut chips, rosemary salt and garlic aioli.", 7],
  ["Sides", "Arancini (4)", 12.9, "arancini", "Mushroom and mozzarella arancini with napoli sauce.", 4],
  ["Salads", "Caesar Salad", 15.9, "caesar", "Cos lettuce, bacon, croutons, parmesan and Caesar dressing.", 3],
  ["Salads", "Rocket & Parmesan", 12.9, "rocket", "Wild rocket, shaved parmesan and balsamic glaze.", 3],
  ["Desserts", "Tiramisu", 11.9, "tiramisu", "House-made with mascarpone, espresso and cocoa.", 3],
  ["Desserts", "Nutella Pizza", 16.9, "nutella-pizza", "Nutella, fresh strawberries and icing sugar. Great to share.", 3],
  ["Desserts", "Gelato (2 scoops)", 7.5, "gelato", "Ask about today's flavours.", 3],
  ["Drinks", "Coca-Cola 375ml", 4.5, "cola", "Classic, no sugar or Diet.", 9],
  ["Drinks", "Sparkling Water 750ml", 6.0, "sparkling-water", "San Pellegrino.", 4],
  ["Drinks", "Lemon, Lime & Bitters", 5.5, "lemon-lime-bitters", "The Aussie classic.", 4],
];

const FIRST = ["Olivia", "Jack", "Charlotte", "Noah", "Amelia", "William", "Isla", "Oliver", "Mia", "Thomas", "Ava", "Lucas", "Grace", "Liam", "Chloe", "Ethan", "Zoe", "Harrison", "Priya", "Arjun", "Mei", "Daniel", "Sofia", "Marco", "Aisha", "Hamish", "Ruby", "Ryan", "Hannah", "Kenji"];
const LAST = ["Smith", "Nguyen", "Brown", "Wilson", "Taylor", "Chen", "Kelly", "Patel", "Martin", "Rossi", "Singh", "Walker", "Murphy", "Lee", "Thompson"];
const STREETS = ["King St", "Enmore Rd", "Australia St", "Wilson St", "Erskineville Rd", "Glebe Point Rd", "Crown St", "Darling St", "Norton St", "Marrickville Rd"];
const SUBURBS = ["Newtown NSW 2042", "Enmore NSW 2042", "Erskineville NSW 2043", "Glebe NSW 2037", "Surry Hills NSW 2010", "Balmain NSW 2041", "Leichhardt NSW 2040", "Marrickville NSW 2204"];
const ALLERGIES = ["Nut allergy", "Gluten free", "Lactose intolerant", "Vegetarian — no meat", "Shellfish allergy", "No chilli please"];
const NOTES = ["Ring the buzzer twice, unit at the back.", "Prefers extra crispy base.", "Usually orders for the whole office on Fridays.", "Leave at the front door.", "Loves extra basil.", "Pays cash on delivery.", "Gate code 2468."];

const auMobile = (r: ReturnType<typeof createRandom>) =>
  `04${r.int(10, 99)} ${r.int(100, 999)} ${r.int(100, 999)}`;

/** Lunch and dinner times, busier in the evening. */
function orderTime(r: ReturnType<typeof createRandom>, day: Date): Date {
  const d = new Date(day);
  const dinner = r.chance(0.72);
  const minutes = dinner ? r.int(17 * 60, 21 * 60 + 30) : r.int(11 * 60 + 30, 14 * 60 + 30);
  d.setHours(Math.floor(minutes / 60), minutes % 60, r.int(0, 59), 0);
  return d;
}

export function buildPizzaDemo(now = new Date()): { data: DemoData; locationId: string } {
  const r = createRandom(20261126);
  const data: DemoData = {};

  // Location + branding
  const location = row({
    name: "Bella Napoli (Demo)",
    address: "212 King St, Newtown NSW 2042",
    phone: "02 9550 1234",
    active: true,
    createdAt: new Date(now.getTime() - 400 * 86400000),
  });
  data.locations = [location];
  data.restaurantSettings = [
    row({
      locationId: location.id,
      restaurantName: "Bella Napoli Pizzeria",
      logoUrl: null,
      primaryColor: "#c0392b",
      tagline: "Wood-fired Neapolitan pizza in Newtown since 1998",
      taxRate: "0.1000",
      currency: "AUD",
      updatedAt: now,
    }),
  ];

  // Menu
  data.menuCategories = CATEGORIES.map((name, i) => row({ name, displayOrder: i + 1 }));
  const categoryId = (name: string) => data.menuCategories.find((c) => c.name === name)!.id;
  data.menuItems = MENU.map(([category, name, price, image, description]) =>
    row({
      name,
      description,
      price: money(price),
      categoryId: categoryId(category),
      imageUrl: `/demo/${image}.svg`,
      available: true,
      createdAt: new Date(now.getTime() - 300 * 86400000),
    }),
  );
  const weighted = MENU.flatMap(([, , , , , weight], i) => Array(weight).fill(data.menuItems[i]));
  const pizzas = data.menuItems.filter((_, i) => MENU[i][0].includes("Pizza"));

  // Staff
  const staffSpec: Array<[string, string]> = [
    ["Giulia Romano", "manager"],
    ["Marco Bianchi", "chef"],
    ["Ana Silva", "chef"],
    ["Tom Nguyen", "server"],
    ["Ella Murphy", "server"],
    ["Sam Patel", "host"],
  ];
  data.staff = staffSpec.map(([name, role]) =>
    row({
      name,
      email: `${name.split(" ")[0].toLowerCase()}@bellanapoli.example`,
      role,
      locationId: location.id,
      active: true,
      createdAt: new Date(now.getTime() - r.int(60, 700) * 86400000),
    }),
  );
  const servers = data.staff.filter((s) => s.role === "server");

  // Areas & tables
  const dining = row({ locationId: location.id, name: "Dining Room", description: "Main room by the wood-fired oven" });
  const courtyard = row({ locationId: location.id, name: "Courtyard", description: "Covered outdoor seating" });
  data.areas = [dining, courtyard];
  data.tables = Array.from({ length: 12 }, (_, i) => {
    const status = i < 3 ? "occupied" : i === 4 ? "reserved" : i === 6 ? "cleaning" : "available";
    return row({
      locationId: location.id,
      areaId: i < 8 ? dining.id : courtyard.id,
      tableNumber: String(i + 1),
      capacity: [2, 2, 4, 4, 4, 6, 2, 8, 4, 4, 6, 2][i],
      status,
      currentPartySize: status === "occupied" ? r.int(2, 4) : null,
      serverId: status === "occupied" ? r.pick(servers).id : null,
    });
  });

  // Customers
  const usedPhones = new Set<string>();
  data.customers = Array.from({ length: 30 }, (_, i) => {
    let phone = auMobile(r);
    while (usedPhones.has(phone)) phone = auMobile(r);
    usedPhones.add(phone);
    const first = FIRST[i];
    const last = r.pick(LAST);
    const tags: string[] = [];
    if (i < 5) tags.push("VIP");
    if (i < 14) tags.push("Regular");
    tags.push(r.chance(0.55) ? "Delivery" : "Pickup");
    if (i === 7 || i === 19) tags.push("Corporate");
    const month = String(r.int(1, 12)).padStart(2, "0");
    const day = String(r.int(1, 28)).padStart(2, "0");
    return row({
      name: `${first} ${last}`,
      phone,
      email: r.chance(0.6) ? `${first.toLowerCase()}.${last.toLowerCase()}@example.com` : null,
      address: tags.includes("Delivery") ? `${r.int(1, 280)} ${r.pick(STREETS)}, ${r.pick(SUBURBS)}` : null,
      // A couple of birthdays this week so the cake icon shows.
      birthday: i === 2 || i === 11
        ? `${1980 + i}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        : `${r.int(1965, 2003)}-${month}-${day}`,
      allergies: r.chance(0.22) ? r.pick(ALLERGIES) : null,
      notes: r.chance(0.35) ? r.pick(NOTES) : null,
      tags,
      totalVisits: 0,
      totalSpent: "0",
      lastOrderAt: null,
      createdAt: new Date(now.getTime() - r.int(30, 380) * 86400000),
    });
  });

  // Orders: last 30 days + today
  data.orders = [];
  data.orderItems = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let orderSeq = 1040;

  for (let back = 30; back >= 0; back--) {
    const day = new Date(today.getTime() - back * 86400000);
    const weekday = day.getDay(); // 5 = Fri, 6 = Sat
    let count = weekday === 5 || weekday === 6 ? r.int(11, 15) : weekday === 0 ? r.int(8, 11) : r.int(5, 9);
    if (back === 0) count = 9;

    const times = Array.from({ length: count }, () => orderTime(r, day)).sort((a, b) => a.getTime() - b.getTime());
    times.forEach((createdAt, idx) => {
      if (back === 0) {
        // Today: spread over the last few hours so the kitchen screen has live tickets.
        createdAt = new Date(now.getTime() - (count - idx) * 17 * 60000);
      }
      const isRegular = r.chance(0.62);
      const customer = isRegular ? data.customers[Math.min(29, Math.floor(r.next() ** 1.8 * 30))] : null;
      const dineIn = !customer?.address && r.chance(0.35);
      const table = dineIn ? r.pick(data.tables) : null;

      const lines = new Map<string, { item: DemoRow; qty: number }>();
      const pizzaCount = r.int(1, 3);
      for (let p = 0; p < pizzaCount; p++) {
        const item = r.pick(pizzas);
        const existing = lines.get(item.id);
        lines.set(item.id, { item, qty: (existing?.qty ?? 0) + 1 });
      }
      const extras = r.int(0, 3);
      for (let e = 0; e < extras; e++) {
        const item = r.pick(weighted);
        const existing = lines.get(item.id);
        lines.set(item.id, { item, qty: (existing?.qty ?? 0) + 1 });
      }

      const subtotal = Array.from(lines.values()).reduce((sum, l) => sum + parseFloat(l.item.price as string) * l.qty, 0);
      const tax = subtotal * 0.1;
      let status = "completed";
      if (back === 0) {
        const fromEnd = count - idx;
        status = fromEnd <= 2 ? "new" : fromEnd <= 4 ? "preparing" : fromEnd === 5 ? "ready" : "completed";
      } else if (r.chance(0.02)) {
        status = "cancelled";
      }

      const order = row({
        orderNumber: `#${orderSeq++}`,
        locationId: location.id,
        tableId: table?.id ?? null,
        customerId: customer?.id ?? null,
        serverId: table ? r.pick(servers).id : null,
        status,
        subtotal: money(subtotal),
        tax: money(tax),
        total: money(subtotal + tax),
        notes: customer
          ? customer.address
            ? `Delivery — ${customer.address}`
            : "Pickup"
          : table
            ? null
            : "Walk-in takeaway",
        createdAt,
        updatedAt: createdAt,
      });
      data.orders.push(order);
      for (const { item, qty } of Array.from(lines.values())) {
        data.orderItems.push(
          row({
            orderId: order.id,
            menuItemId: item.id,
            quantity: qty,
            price: item.price,
            notes: r.chance(0.08) ? r.pick(["Extra crispy", "No olives", "Half and half", "Extra cheese"]) : null,
          }),
        );
      }

      if (customer && status !== "cancelled") {
        customer.totalVisits = (customer.totalVisits as number) + 1;
        customer.totalSpent = money(parseFloat(customer.totalSpent as string) + subtotal + tax);
        if (!customer.lastOrderAt || (customer.lastOrderAt as Date) < createdAt) customer.lastOrderAt = createdAt;
      }
    });
  }

  // Reservations: a few past, more upcoming
  data.reservations = Array.from({ length: 14 }, (_, i) => {
    const daysAhead = i < 4 ? -r.int(1, 10) : r.int(0, 7);
    const when = new Date(today.getTime() + daysAhead * 86400000);
    when.setHours(r.pick([18, 18, 19, 19, 20]), r.pick([0, 30]), 0, 0);
    const customer = r.chance(0.6) ? r.pick(data.customers) : null;
    const name = customer ? (customer.name as string) : `${r.pick(FIRST)} ${r.pick(LAST)}`;
    return row({
      locationId: location.id,
      customerId: customer?.id ?? null,
      tableId: r.chance(0.7) ? r.pick(data.tables).id : null,
      customerName: name,
      customerPhone: (customer?.phone as string | undefined) ?? auMobile(r),
      customerEmail: (customer?.email as string | undefined) ?? null,
      partySize: r.int(2, 8),
      reservationDate: when,
      status: daysAhead < 0 ? "completed" : r.chance(0.6) ? "confirmed" : "pending",
      notes: r.chance(0.3) ? r.pick(["Birthday — candle on dessert", "High chair needed", "Window table if possible", "Gluten free guest"]) : null,
      createdAt: new Date(when.getTime() - r.int(1, 14) * 86400000),
    });
  });

  // Call history: last 14 days, most linked to orders from known customers
  const recentCustomerOrders = data.orders.filter(
    (o) => o.customerId && (o.createdAt as Date) > new Date(now.getTime() - 14 * 86400000) && o.status !== "cancelled",
  );
  data.callLogs = [];
  for (const order of recentCustomerOrders) {
    if (!r.chance(0.6)) continue;
    const customer = data.customers.find((c) => c.id === order.customerId)!;
    data.callLogs.push(
      row({
        locationId: location.id,
        phone: customer.phone,
        customerId: customer.id,
        customerName: customer.name,
        outcome: "order_placed",
        orderId: order.id,
        createdAt: new Date((order.createdAt as Date).getTime() - r.int(1, 4) * 60000),
      }),
    );
  }
  for (let i = 0; i < 12; i++) {
    const known = r.chance(0.5) ? r.pick(data.customers) : null;
    const when = new Date(now.getTime() - r.int(0, 13) * 86400000);
    when.setHours(r.int(11, 21), r.int(0, 59), 0, 0);
    if (when > now) when.setTime(now.getTime() - r.int(10, 120) * 60000);
    data.callLogs.push(
      row({
        locationId: location.id,
        phone: known ? known.phone : auMobile(r),
        customerId: known?.id ?? null,
        customerName: known?.name ?? null,
        outcome: "no_order",
        orderId: null,
        createdAt: when,
      }),
    );
  }

  return { data, locationId: location.id };
}

/** Collections the demo writes to (same names in Firestore and the JSON file). */
export const DEMO_COLLECTIONS = [
  "locations",
  "restaurantSettings",
  "menuCategories",
  "menuItems",
  "staff",
  "areas",
  "tables",
  "customers",
  "orders",
  "orderItems",
  "reservations",
  "callLogs",
  "payments",
] as const;
