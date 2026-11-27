import { JsonStorage } from "./json-storage.js";
import { FirestoreStorage } from "./firestore-storage.js";
import { hasFirebaseCredentials } from "./firebase-admin.js";
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
  CallLog,
  InsertCallLog,
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
  getOrdersByCustomer(customerId: string, limit: number): Promise<OrderWithItems[]>;
  
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
  /** Adds one visit and the order total to the customer's stats. */
  recordCustomerOrder(customerId: string, orderTotal: number): Promise<void>;

  // Call log (caller ID)
  getCallLogs(locationId: string | undefined, limit: number): Promise<CallLog[]>;
  createCallLog(call: InsertCallLog): Promise<CallLog>;
  updateCallLog(id: string, call: Partial<InsertCallLog>): Promise<CallLog | undefined>;

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

  // Demo data (records flagged `demo: true`)
  /** Writes ready-made records (with ids) straight into a collection. */
  insertMany(collection: string, rows: Array<Record<string, unknown> & { id: string }>): Promise<void>;
  hasDemoData(): Promise<boolean>;
  /** Deletes every record flagged as demo; returns how many were removed. */
  purgeDemoData(collections: readonly string[]): Promise<number>;

  // Analytics
  getSalesData(locationId: string, startDate: Date, endDate: Date): Promise<any>;
}

function createStorage(): IStorage {
  if (hasFirebaseCredentials()) {
    return new FirestoreStorage();
  }
  if (process.env.VERCEL) {
    // Vercel can't keep files between requests, so the JSON file won't work there.
    throw new Error(
      "Firebase database is not configured. Add FIREBASE_SERVICE_ACCOUNT to the Vercel project's environment variables.",
    );
  }
  // Local development without Firebase credentials: use data/restaurant-data.json
  return new JsonStorage();
}

export const storage: IStorage = createStorage();
