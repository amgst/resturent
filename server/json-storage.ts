import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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
import type { IStorage } from "./storage";

interface JsonData {
  locations: Location[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  areas: Area[];
  tables: Table[];
  orders: Order[];
  orderItems: OrderItem[];
  staff: Staff[];
  customers: Customer[];
  reservations: Reservation[];
  payments: Payment[];
  restaurantSettings: RestaurantSettings[];
}

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'restaurant-data.json');

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeToNull<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    result[key] = value === undefined ? null : value;
  }
  return result as T;
}

export class JsonStorage implements IStorage {
  private data: JsonData;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): JsonData {
    if (existsSync(DATA_FILE)) {
      try {
        const content = readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content, (key, value) => {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      } catch (error) {
        console.error('Error loading data file:', error);
        return this.getEmptyData();
      }
    }
    return this.getEmptyData();
  }

  private getEmptyData(): JsonData {
    return {
      locations: [],
      menuCategories: [],
      menuItems: [],
      areas: [],
      tables: [],
      orders: [],
      orderItems: [],
      staff: [],
      customers: [],
      reservations: [],
      payments: [],
      restaurantSettings: [],
    };
  }

  private saveData(): void {
    try {
      writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving data file:', error);
      throw error;
    }
  }

  async getLocations(): Promise<Location[]> {
    return [...this.data.locations];
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.data.locations.find(l => l.id === id);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const normalized = normalizeToNull(location);
    const newLocation: Location = {
      id: generateId(),
      createdAt: new Date(),
      phone: null,
      active: true,
      ...normalized,
    };
    this.data.locations.push(newLocation);
    this.saveData();
    return newLocation;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const index = this.data.locations.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    
    this.data.locations[index] = {
      ...this.data.locations[index],
      ...location,
    };
    this.saveData();
    return this.data.locations[index];
  }

  async getMenuCategories(): Promise<MenuCategory[]> {
    return [...this.data.menuCategories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const normalized = normalizeToNull(category);
    const newCategory: MenuCategory = {
      id: generateId(),
      displayOrder: 0,
      ...normalized,
    };
    this.data.menuCategories.push(newCategory);
    this.saveData();
    return newCategory;
  }

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    if (categoryId) {
      return this.data.menuItems.filter(item => item.categoryId === categoryId);
    }
    return [...this.data.menuItems];
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return this.data.menuItems.find(item => item.id === id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const normalized = normalizeToNull(item);
    const newItem: MenuItem = {
      id: generateId(),
      createdAt: new Date(),
      description: null,
      categoryId: null,
      imageUrl: null,
      available: true,
      ...normalized,
    };
    this.data.menuItems.push(newItem);
    this.saveData();
    return newItem;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const index = this.data.menuItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    this.data.menuItems[index] = {
      ...this.data.menuItems[index],
      ...item,
    };
    this.saveData();
    return this.data.menuItems[index];
  }

  async deleteMenuItem(id: string): Promise<void> {
    this.data.menuItems = this.data.menuItems.filter(item => item.id !== id);
    this.saveData();
  }

  async getAreas(locationId: string): Promise<Area[]> {
    return this.data.areas.filter(area => area.locationId === locationId);
  }

  async createArea(area: InsertArea): Promise<Area> {
    const normalized = normalizeToNull(area);
    const newArea: Area = {
      id: generateId(),
      description: null,
      ...normalized,
    };
    this.data.areas.push(newArea);
    this.saveData();
    return newArea;
  }

  async getTables(locationId: string): Promise<TableWithDetails[]> {
    const locationTables = this.data.tables.filter(t => t.locationId === locationId);
    return locationTables.map(table => ({
      ...table,
      area: this.data.areas.find(a => a.id === table.areaId),
      server: this.data.staff.find(s => s.id === table.serverId),
    }));
  }

  async getTable(id: string): Promise<Table | undefined> {
    return this.data.tables.find(t => t.id === id);
  }

  async createTable(table: InsertTable): Promise<Table> {
    const normalized = normalizeToNull(table);
    const newTable: Table = {
      id: generateId(),
      areaId: null,
      status: "available",
      currentPartySize: null,
      serverId: null,
      ...normalized,
    };
    this.data.tables.push(newTable);
    this.saveData();
    return newTable;
  }

  async updateTable(id: string, table: Partial<InsertTable>): Promise<Table | undefined> {
    const index = this.data.tables.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.data.tables[index] = {
      ...this.data.tables[index],
      ...table,
    };
    this.saveData();
    return this.data.tables[index];
  }

  async getOrders(locationId: string, status?: string): Promise<OrderWithItems[]> {
    let orders = this.data.orders
      .filter(o => o.locationId === locationId)
      .filter(o => !status || o.status === status);
    
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return orders.map(order => this.buildOrderWithItems(order));
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return undefined;
    return this.buildOrderWithItems(order);
  }

  private buildOrderWithItems(order: Order): OrderWithItems {
    const items = this.data.orderItems
      .filter(oi => oi.orderId === order.id)
      .map(oi => ({
        ...oi,
        menuItem: this.data.menuItems.find(mi => mi.id === oi.menuItemId)!,
      }));

    return {
      ...order,
      items,
      table: this.data.tables.find(t => t.id === order.tableId),
      customer: this.data.customers.find(c => c.id === order.customerId),
      server: this.data.staff.find(s => s.id === order.serverId),
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const normalized = normalizeToNull(order);
    const newOrder: Order = {
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "new",
      serverId: null,
      tableId: null,
      customerId: null,
      notes: null,
      ...normalized,
    };
    this.data.orders.push(newOrder);

    const orderItems = items.map(item => {
      const normalizedItem = normalizeToNull(item);
      return {
        id: generateId(),
        orderId: newOrder.id,
        notes: null,
        ...normalizedItem,
      };
    });
    this.data.orderItems.push(...orderItems);
    
    this.saveData();
    return this.buildOrderWithItems(newOrder);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    this.data.orders[index] = {
      ...this.data.orders[index],
      status: status as any,
      updatedAt: new Date(),
    };
    this.saveData();
    return this.data.orders[index];
  }

  async getStaff(locationId?: string): Promise<Staff[]> {
    if (locationId) {
      return this.data.staff.filter(s => s.locationId === locationId);
    }
    return [...this.data.staff];
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    return this.data.staff.find(s => s.id === id);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const normalized = normalizeToNull(staff);
    const newStaff: Staff = {
      id: generateId(),
      createdAt: new Date(),
      active: true,
      locationId: null,
      ...normalized,
    };
    this.data.staff.push(newStaff);
    this.saveData();
    return newStaff;
  }

  async updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined> {
    const index = this.data.staff.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.data.staff[index] = {
      ...this.data.staff[index],
      ...staff,
    };
    this.saveData();
    return this.data.staff[index];
  }

  async getCustomers(): Promise<Customer[]> {
    return [...this.data.customers].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.data.customers.find(c => c.id === id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const normalized = normalizeToNull(customer);
    const newCustomer: Customer = {
      id: generateId(),
      createdAt: new Date(),
      totalVisits: 0,
      totalSpent: "0",
      phone: null,
      email: null,
      notes: null,
      ...normalized,
    };
    this.data.customers.push(newCustomer);
    this.saveData();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.data.customers[index] = {
      ...this.data.customers[index],
      ...customer,
    };
    this.saveData();
    return this.data.customers[index];
  }

  async getReservations(locationId: string, date?: Date): Promise<ReservationWithDetails[]> {
    let reservations = this.data.reservations.filter(r => r.locationId === locationId);
    
    reservations.sort((a, b) => 
      a.reservationDate.getTime() - b.reservationDate.getTime()
    );

    return reservations.map(reservation => ({
      ...reservation,
      customer: this.data.customers.find(c => c.id === reservation.customerId),
      table: this.data.tables.find(t => t.id === reservation.tableId),
    }));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    return this.data.reservations.find(r => r.id === id);
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const normalized = normalizeToNull(reservation);
    const newReservation: Reservation = {
      id: generateId(),
      createdAt: new Date(),
      status: "pending",
      tableId: null,
      notes: null,
      customerId: null,
      customerPhone: null,
      customerEmail: null,
      ...normalized,
    };
    this.data.reservations.push(newReservation);
    this.saveData();
    return newReservation;
  }

  async updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const index = this.data.reservations.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    this.data.reservations[index] = {
      ...this.data.reservations[index],
      ...reservation,
    };
    this.saveData();
    return this.data.reservations[index];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const normalized = normalizeToNull(payment);
    const newPayment: Payment = {
      id: generateId(),
      createdAt: new Date(),
      status: "pending",
      transactionId: null,
      ...normalized,
    };
    this.data.payments.push(newPayment);
    this.saveData();
    return newPayment;
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return this.data.payments.filter(p => p.orderId === orderId);
  }

  async getSettings(locationId?: string): Promise<RestaurantSettings | undefined> {
    if (locationId) {
      return this.data.restaurantSettings.find(s => s.locationId === locationId);
    }
    return this.data.restaurantSettings[0];
  }

  async updateSettings(id: string, settings: Partial<InsertRestaurantSettings>): Promise<RestaurantSettings | undefined> {
    const index = this.data.restaurantSettings.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.data.restaurantSettings[index] = {
      ...this.data.restaurantSettings[index],
      ...settings,
      updatedAt: new Date(),
    };
    this.saveData();
    return this.data.restaurantSettings[index];
  }

  async createSettings(settings: InsertRestaurantSettings): Promise<RestaurantSettings> {
    const normalized = normalizeToNull(settings);
    const newSettings: RestaurantSettings = {
      id: generateId(),
      updatedAt: new Date(),
      locationId: null,
      logoUrl: null,
      primaryColor: "#ea580c",
      tagline: null,
      taxRate: "0.10",
      currency: "USD",
      ...normalized,
    };
    this.data.restaurantSettings.push(newSettings);
    this.saveData();
    return newSettings;
  }

  async getSalesData(locationId: string, startDate: Date, endDate: Date): Promise<any> {
    const orders = this.data.orders.filter(order => 
      order.locationId === locationId &&
      order.createdAt >= startDate &&
      order.createdAt <= endDate
    );

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

export const storage = new JsonStorage();
