import { Timestamp, FieldPath, type DocumentSnapshot } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin.js";
import type {
  Location,
  InsertLocation,
  MenuItem,
  InsertMenuItem,
  MenuCategory,
  InsertMenuCategory,
  Table,
  InsertTable,
  Area,
  InsertArea,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Staff,
  InsertStaff,
  Customer,
  InsertCustomer,
  Reservation,
  InsertReservation,
  Payment,
  InsertPayment,
  RestaurantSettings,
  InsertRestaurantSettings,
  OrderWithItems,
  TableWithDetails,
  ReservationWithDetails,
} from "../shared/schema.js";
import type { IStorage } from "./storage.js";

/** Firestore collection names (one per data type). */
const C = {
  locations: "locations",
  menuCategories: "menuCategories",
  menuItems: "menuItems",
  areas: "areas",
  tables: "tables",
  orders: "orders",
  orderItems: "orderItems",
  staff: "staff",
  customers: "customers",
  reservations: "reservations",
  payments: "payments",
  settings: "restaurantSettings",
} as const;

/** Firestore stores dates as Timestamps; the app expects JS Dates. */
function toAppValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(toAppValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toAppValue(v)]));
  }
  return value;
}

function fromDoc<T>(snap: DocumentSnapshot): T {
  return { ...(toAppValue(snap.data()) as object), id: snap.id } as T;
}

/** Missing optional fields are stored as null (same as the old database did). */
function nullify<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const key of Object.keys(obj)) out[key] = obj[key] === undefined ? null : obj[key];
  return out;
}

async function listAll<T>(collection: string): Promise<T[]> {
  const snap = await getDb().collection(collection).get();
  return snap.docs.map((d) => fromDoc<T>(d));
}

async function listWhere<T>(collection: string, field: string, value: unknown): Promise<T[]> {
  const snap = await getDb().collection(collection).where(field, "==", value).get();
  return snap.docs.map((d) => fromDoc<T>(d));
}

async function getOne<T>(collection: string, id: string): Promise<T | undefined> {
  const snap = await getDb().collection(collection).doc(id).get();
  return snap.exists ? fromDoc<T>(snap) : undefined;
}

/** Loads several documents by id; returns a Map id → document. */
async function getMany<T>(collection: string, ids: Array<string | null | undefined>): Promise<Map<string, T>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  const result = new Map<string, T>();
  if (unique.length === 0) return result;
  const refs = unique.map((id) => getDb().collection(collection).doc(id));
  const snaps = await getDb().getAll(...refs);
  for (const snap of snaps) {
    if (snap.exists) result.set(snap.id, fromDoc<T>(snap));
  }
  return result;
}

async function create<T extends { id: string }>(collection: string, data: Omit<T, "id">): Promise<T> {
  const ref = getDb().collection(collection).doc();
  await ref.set(data);
  return { ...(data as object), id: ref.id } as T;
}

async function update<T>(collection: string, id: string, changes: Record<string, unknown>): Promise<T | undefined> {
  const ref = getDb().collection(collection).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return undefined;
  const { id: _ignored, ...fields } = changes;
  if (Object.keys(fields).length > 0) {
    await ref.update(fields);
  }
  return fromDoc<T>(await ref.get());
}

const byNewest = <T extends { createdAt: Date }>(a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime();

export class FirestoreStorage implements IStorage {
  // Locations
  async getLocations(): Promise<Location[]> {
    return listAll<Location>(C.locations);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return getOne<Location>(C.locations, id);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    return create<Location>(C.locations, {
      phone: null,
      active: true,
      ...nullify(location),
      createdAt: new Date(),
    });
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined> {
    return update<Location>(C.locations, id, location);
  }

  // Menu categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    const categories = await listAll<MenuCategory>(C.menuCategories);
    return categories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    return create<MenuCategory>(C.menuCategories, { displayOrder: 0, ...nullify(category) });
  }

  // Menu items
  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    return categoryId ? listWhere<MenuItem>(C.menuItems, "categoryId", categoryId) : listAll<MenuItem>(C.menuItems);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return getOne<MenuItem>(C.menuItems, id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    return create<MenuItem>(C.menuItems, {
      description: null,
      categoryId: null,
      imageUrl: null,
      available: true,
      ...nullify(item),
      createdAt: new Date(),
    });
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    return update<MenuItem>(C.menuItems, id, item);
  }

  async deleteMenuItem(id: string): Promise<void> {
    await getDb().collection(C.menuItems).doc(id).delete();
  }

  // Areas
  async getAreas(locationId: string): Promise<Area[]> {
    return listWhere<Area>(C.areas, "locationId", locationId);
  }

  async createArea(area: InsertArea): Promise<Area> {
    return create<Area>(C.areas, { description: null, ...nullify(area) });
  }

  // Tables
  async getTables(locationId: string): Promise<TableWithDetails[]> {
    const [tables, areas] = await Promise.all([
      listWhere<Table>(C.tables, "locationId", locationId),
      listWhere<Area>(C.areas, "locationId", locationId),
    ]);
    const staff = await getMany<Staff>(C.staff, tables.map((t) => t.serverId));
    return tables.map((table) => ({
      ...table,
      area: areas.find((a) => a.id === table.areaId),
      server: table.serverId ? staff.get(table.serverId) : undefined,
    }));
  }

  async getTable(id: string): Promise<Table | undefined> {
    return getOne<Table>(C.tables, id);
  }

  async createTable(table: InsertTable): Promise<Table> {
    return create<Table>(C.tables, {
      areaId: null,
      status: "available",
      currentPartySize: null,
      serverId: null,
      ...nullify(table),
    });
  }

  async updateTable(id: string, table: Partial<InsertTable>): Promise<Table | undefined> {
    return update<Table>(C.tables, id, table);
  }

  // Orders
  /** Adds items (with their menu item), table, customer and server to each order. */
  private async withDetails(orders: Order[]): Promise<OrderWithItems[]> {
    if (orders.length === 0) return [];

    const items: OrderItem[] = [];
    const ids = orders.map((o) => o.id);
    for (let i = 0; i < ids.length; i += 30) {
      // Firestore "in" queries accept up to 30 values.
      const snap = await getDb().collection(C.orderItems).where("orderId", "in", ids.slice(i, i + 30)).get();
      items.push(...snap.docs.map((d) => fromDoc<OrderItem>(d)));
    }

    const [menuItems, tables, customers, staff] = await Promise.all([
      getMany<MenuItem>(C.menuItems, items.map((i) => i.menuItemId)),
      getMany<Table>(C.tables, orders.map((o) => o.tableId)),
      getMany<Customer>(C.customers, orders.map((o) => o.customerId)),
      getMany<Staff>(C.staff, orders.map((o) => o.serverId)),
    ]);

    return orders.map((order) => ({
      ...order,
      items: items
        .filter((item) => item.orderId === order.id && menuItems.has(item.menuItemId))
        .map((item) => ({ ...item, menuItem: menuItems.get(item.menuItemId)! })),
      table: order.tableId ? tables.get(order.tableId) : undefined,
      customer: order.customerId ? customers.get(order.customerId) : undefined,
      server: order.serverId ? staff.get(order.serverId) : undefined,
    }));
  }

  async getOrders(locationId: string, status?: string): Promise<OrderWithItems[]> {
    const orders = (await listWhere<Order>(C.orders, "locationId", locationId))
      .filter((o) => !status || o.status === status)
      .sort(byNewest);
    return this.withDetails(orders);
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const order = await getOne<Order>(C.orders, id);
    if (!order) return undefined;
    const [full] = await this.withDetails([order]);
    return full;
  }

  async getOrdersByCustomer(customerId: string, limit: number): Promise<OrderWithItems[]> {
    const orders = (await listWhere<Order>(C.orders, "customerId", customerId)).sort(byNewest).slice(0, limit);
    return this.withDetails(orders);
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const db = getDb();
    const now = new Date();
    const orderRef = db.collection(C.orders).doc();
    const batch = db.batch();

    batch.set(orderRef, {
      status: "new",
      serverId: null,
      tableId: null,
      customerId: null,
      notes: null,
      ...nullify(order),
      createdAt: now,
      updatedAt: now,
    });
    for (const item of items) {
      batch.set(db.collection(C.orderItems).doc(), { notes: null, ...nullify(item), orderId: orderRef.id });
    }
    await batch.commit();

    return (await this.getOrder(orderRef.id))!;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return update<Order>(C.orders, id, { status, updatedAt: new Date() });
  }

  // Staff
  async getStaff(locationId?: string): Promise<Staff[]> {
    return locationId ? listWhere<Staff>(C.staff, "locationId", locationId) : listAll<Staff>(C.staff);
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    return getOne<Staff>(C.staff, id);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    return create<Staff>(C.staff, { active: true, locationId: null, ...nullify(staff), createdAt: new Date() });
  }

  async updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined> {
    return update<Staff>(C.staff, id, staff);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return (await listAll<Customer>(C.customers)).sort(byNewest);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return getOne<Customer>(C.customers, id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return create<Customer>(C.customers, {
      totalVisits: 0,
      totalSpent: "0",
      phone: null,
      email: null,
      notes: null,
      ...nullify(customer),
      createdAt: new Date(),
    });
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    return update<Customer>(C.customers, id, customer);
  }

  // Reservations
  async getReservations(locationId: string, _date?: Date): Promise<ReservationWithDetails[]> {
    const reservations = (await listWhere<Reservation>(C.reservations, "locationId", locationId)).sort(
      (a, b) => a.reservationDate.getTime() - b.reservationDate.getTime(),
    );
    const [customers, tables] = await Promise.all([
      getMany<Customer>(C.customers, reservations.map((r) => r.customerId)),
      getMany<Table>(C.tables, reservations.map((r) => r.tableId)),
    ]);
    return reservations.map((reservation) => ({
      ...reservation,
      customer: reservation.customerId ? customers.get(reservation.customerId) : undefined,
      table: reservation.tableId ? tables.get(reservation.tableId) : undefined,
    }));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    return getOne<Reservation>(C.reservations, id);
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    return create<Reservation>(C.reservations, {
      status: "pending",
      tableId: null,
      notes: null,
      customerId: null,
      customerPhone: null,
      customerEmail: null,
      ...nullify(reservation),
      createdAt: new Date(),
    });
  }

  async updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    return update<Reservation>(C.reservations, id, reservation);
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return create<Payment>(C.payments, {
      status: "pending",
      transactionId: null,
      ...nullify(payment),
      createdAt: new Date(),
    });
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return listWhere<Payment>(C.payments, "orderId", orderId);
  }

  // Settings
  async getSettings(locationId?: string): Promise<RestaurantSettings | undefined> {
    const query = locationId
      ? getDb().collection(C.settings).where("locationId", "==", locationId).limit(1)
      : getDb().collection(C.settings).orderBy(FieldPath.documentId()).limit(1);
    const snap = await query.get();
    return snap.empty ? undefined : fromDoc<RestaurantSettings>(snap.docs[0]);
  }

  async updateSettings(
    id: string,
    settings: Partial<InsertRestaurantSettings>,
  ): Promise<RestaurantSettings | undefined> {
    return update<RestaurantSettings>(C.settings, id, { ...settings, updatedAt: new Date() });
  }

  async createSettings(settings: InsertRestaurantSettings): Promise<RestaurantSettings> {
    return create<RestaurantSettings>(C.settings, {
      locationId: null,
      logoUrl: null,
      primaryColor: "#ea580c",
      tagline: null,
      taxRate: "0.10",
      currency: "USD",
      ...nullify(settings),
      updatedAt: new Date(),
    });
  }

  // Analytics
  async getSalesData(locationId: string, startDate: Date, endDate: Date): Promise<any> {
    const orders = (await listWhere<Order>(C.orders, "locationId", locationId)).filter(
      (order) => order.createdAt >= startDate && order.createdAt <= endDate,
    );

    const dailySales: Record<string, { date: string; sales: number; orders: number }> = {};
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      dailySales[dateKey] ??= { date: dateKey, sales: 0, orders: 0 };
      dailySales[dateKey].sales += parseFloat(order.total);
      dailySales[dateKey].orders += 1;
    }

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    return {
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}

