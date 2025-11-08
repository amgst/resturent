import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import * as schema from "@shared/schema";
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
} from "@shared/schema";

export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;

  // Menu Categories
  getMenuCategories(): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;

  // Menu Items
  getMenuItems(categoryId?: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<void>;

  // Areas
  getAreas(locationId: string): Promise<Area[]>;
  createArea(area: InsertArea): Promise<Area>;

  // Tables
  getTables(locationId: string): Promise<TableWithDetails[]>;
  getTable(id: string): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: string, table: Partial<InsertTable>): Promise<Table | undefined>;

  // Orders
  getOrders(locationId: string, status?: string): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Staff
  getStaff(locationId?: string): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Reservations
  getReservations(locationId: string, date?: Date): Promise<ReservationWithDetails[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByOrder(orderId: string): Promise<Payment[]>;

  // Settings
  getSettings(locationId?: string): Promise<RestaurantSettings | undefined>;
  updateSettings(id: string, settings: Partial<InsertRestaurantSettings>): Promise<RestaurantSettings | undefined>;
  createSettings(settings: InsertRestaurantSettings): Promise<RestaurantSettings>;

  // Analytics
  getSalesData(locationId: string, startDate: Date, endDate: Date): Promise<any>;
}

export class DbStorage implements IStorage {
  // Locations
  async getLocations(): Promise<Location[]> {
    return db.select().from(schema.locations);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(schema.locations).where(eq(schema.locations.id, id));
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [created] = await db.insert(schema.locations).values(location).returning();
    return created;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updated] = await db.update(schema.locations).set(location).where(eq(schema.locations.id, id)).returning();
    return updated;
  }

  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    return db.select().from(schema.menuCategories).orderBy(schema.menuCategories.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [created] = await db.insert(schema.menuCategories).values(category).returning();
    return created;
  }

  // Menu Items
  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    if (categoryId) {
      return db.select().from(schema.menuItems).where(eq(schema.menuItems.categoryId, categoryId));
    }
    return db.select().from(schema.menuItems);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(schema.menuItems).where(eq(schema.menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(schema.menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(schema.menuItems).set(item).where(eq(schema.menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  }

  // Areas
  async getAreas(locationId: string): Promise<Area[]> {
    return db.select().from(schema.areas).where(eq(schema.areas.locationId, locationId));
  }

  async createArea(area: InsertArea): Promise<Area> {
    const [created] = await db.insert(schema.areas).values(area).returning();
    return created;
  }

  // Tables
  async getTables(locationId: string): Promise<TableWithDetails[]> {
    const results = await db
      .select({
        table: schema.tables,
        area: schema.areas,
        server: schema.staff,
      })
      .from(schema.tables)
      .leftJoin(schema.areas, eq(schema.tables.areaId, schema.areas.id))
      .leftJoin(schema.staff, eq(schema.tables.serverId, schema.staff.id))
      .where(eq(schema.tables.locationId, locationId));

    return results.map((r) => ({
      ...r.table,
      area: r.area || undefined,
      server: r.server || undefined,
    }));
  }

  async getTable(id: string): Promise<Table | undefined> {
    const [table] = await db.select().from(schema.tables).where(eq(schema.tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [created] = await db.insert(schema.tables).values(table).returning();
    return created;
  }

  async updateTable(id: string, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updated] = await db.update(schema.tables).set(table).where(eq(schema.tables.id, id)).returning();
    return updated;
  }

  // Orders
  async getOrders(locationId: string, status?: string): Promise<OrderWithItems[]> {
    const whereConditions = status
      ? and(eq(schema.orders.locationId, locationId), eq(schema.orders.status, status as any))
      : eq(schema.orders.locationId, locationId);

    const orderResults = await db
      .select({
        order: schema.orders,
        table: schema.tables,
        customer: schema.customers,
        server: schema.staff,
      })
      .from(schema.orders)
      .leftJoin(schema.tables, eq(schema.orders.tableId, schema.tables.id))
      .leftJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
      .leftJoin(schema.staff, eq(schema.orders.serverId, schema.staff.id))
      .where(whereConditions)
      .orderBy(desc(schema.orders.createdAt));

    // Get all order items
    const ordersWithItems = await Promise.all(
      orderResults.map(async (result) => {
        const items = await db
          .select({
            orderItem: schema.orderItems,
            menuItem: schema.menuItems,
          })
          .from(schema.orderItems)
          .innerJoin(schema.menuItems, eq(schema.orderItems.menuItemId, schema.menuItems.id))
          .where(eq(schema.orderItems.orderId, result.order.id));

        return {
          ...result.order,
          items: items.map((i) => ({ ...i.orderItem, menuItem: i.menuItem })),
          table: result.table || undefined,
          customer: result.customer || undefined,
          server: result.server || undefined,
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [orderResult] = await db
      .select({
        order: schema.orders,
        table: schema.tables,
        customer: schema.customers,
        server: schema.staff,
      })
      .from(schema.orders)
      .leftJoin(schema.tables, eq(schema.orders.tableId, schema.tables.id))
      .leftJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
      .leftJoin(schema.staff, eq(schema.orders.serverId, schema.staff.id))
      .where(eq(schema.orders.id, id));

    if (!orderResult) return undefined;

    const items = await db
      .select({
        orderItem: schema.orderItems,
        menuItem: schema.menuItems,
      })
      .from(schema.orderItems)
      .innerJoin(schema.menuItems, eq(schema.orderItems.menuItemId, schema.menuItems.id))
      .where(eq(schema.orderItems.orderId, id));

    return {
      ...orderResult.order,
      items: items.map((i) => ({ ...i.orderItem, menuItem: i.menuItem })),
      table: orderResult.table || undefined,
      customer: orderResult.customer || undefined,
      server: orderResult.server || undefined,
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [created] = await db.insert(schema.orders).values(order).returning();

    const orderItemsToInsert = items.map((item) => ({
      ...item,
      orderId: created.id,
    }));

    await db.insert(schema.orderItems).values(orderItemsToInsert);

    const fullOrder = await this.getOrder(created.id);
    return fullOrder!;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(schema.orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return updated;
  }

  // Staff
  async getStaff(locationId?: string): Promise<Staff[]> {
    if (locationId) {
      return db.select().from(schema.staff).where(eq(schema.staff.locationId, locationId));
    }
    return db.select().from(schema.staff);
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const [staff] = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
    return staff;
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const [created] = await db.insert(schema.staff).values(staff).returning();
    return created;
  }

  async updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updated] = await db.update(schema.staff).set(staff).where(eq(schema.staff.id, id)).returning();
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(schema.customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(schema.customers).set(customer).where(eq(schema.customers.id, id)).returning();
    return updated;
  }

  // Reservations
  async getReservations(locationId: string, date?: Date): Promise<ReservationWithDetails[]> {
    let query = db
      .select({
        reservation: schema.reservations,
        customer: schema.customers,
        table: schema.tables,
      })
      .from(schema.reservations)
      .leftJoin(schema.customers, eq(schema.reservations.customerId, schema.customers.id))
      .leftJoin(schema.tables, eq(schema.reservations.tableId, schema.tables.id))
      .where(eq(schema.reservations.locationId, locationId))
      .orderBy(schema.reservations.reservationDate);

    const results = await query;

    return results.map((r) => ({
      ...r.reservation,
      customer: r.customer || undefined,
      table: r.table || undefined,
    }));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(schema.reservations).where(eq(schema.reservations.id, id));
    return reservation;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [created] = await db.insert(schema.reservations).values(reservation).returning();
    return created;
  }

  async updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const [updated] = await db
      .update(schema.reservations)
      .set(reservation)
      .where(eq(schema.reservations.id, id))
      .returning();
    return updated;
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(schema.payments).values(payment).returning();
    return created;
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId));
  }

  // Settings
  async getSettings(locationId?: string): Promise<RestaurantSettings | undefined> {
    if (locationId) {
      const [settings] = await db
        .select()
        .from(schema.restaurantSettings)
        .where(eq(schema.restaurantSettings.locationId, locationId));
      return settings;
    }
    const [settings] = await db.select().from(schema.restaurantSettings).limit(1);
    return settings;
  }

  async updateSettings(id: string, settings: Partial<InsertRestaurantSettings>): Promise<RestaurantSettings | undefined> {
    const [updated] = await db
      .update(schema.restaurantSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.restaurantSettings.id, id))
      .returning();
    return updated;
  }

  async createSettings(settings: InsertRestaurantSettings): Promise<RestaurantSettings> {
    const [created] = await db.insert(schema.restaurantSettings).values(settings).returning();
    return created;
  }

  // Analytics
  async getSalesData(locationId: string, startDate: Date, endDate: Date): Promise<any> {
    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.locationId, locationId),
          gte(schema.orders.createdAt, startDate),
          lte(schema.orders.createdAt, endDate)
        )
      );

    // Group orders by day
    const dailySales: { [key: string]: { date: string; sales: number; orders: number } } = {};
    
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      dailySales[dateKey].sales += parseFloat(order.total);
      dailySales[dateKey].orders += 1;
    });

    const dailySalesArray = Object.values(dailySales).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.total), 0) / orders.length : 0,
      dailySales: dailySalesArray,
    };
  }
}

export const storage = new DbStorage();
