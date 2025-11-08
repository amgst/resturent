import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertLocationSchema,
  insertMenuItemSchema,
  insertMenuCategorySchema,
  insertTableSchema,
  insertAreaSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertStaffSchema,
  insertCustomerSchema,
  insertReservationSchema,
  insertPaymentSchema,
  insertRestaurantSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Location routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validated = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validated);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ error: "Invalid location data" });
    }
  });

  app.patch("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Menu Category routes
  app.get("/api/menu-categories", async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/menu-categories", async (req, res) => {
    try {
      const validated = insertMenuCategorySchema.parse(req.body);
      const category = await storage.createMenuCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  // Menu Item routes
  app.get("/api/menu-items", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const items = await storage.getMenuItems(categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-items/:id", async (req, res) => {
    try {
      const item = await storage.getMenuItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu item" });
    }
  });

  app.post("/api/menu-items", async (req, res) => {
    try {
      const validated = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu item data" });
    }
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    try {
      const item = await storage.updateMenuItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      await storage.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Area routes
  app.get("/api/areas", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }
      const areas = await storage.getAreas(locationId);
      res.json(areas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch areas" });
    }
  });

  app.post("/api/areas", async (req, res) => {
    try {
      const validated = insertAreaSchema.parse(req.body);
      const area = await storage.createArea(validated);
      res.status(201).json(area);
    } catch (error) {
      res.status(400).json({ error: "Invalid area data" });
    }
  });

  // Table routes
  app.get("/api/tables", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }
      const tables = await storage.getTables(locationId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const table = await storage.getTable(req.params.id);
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch table" });
    }
  });

  app.post("/api/tables", async (req, res) => {
    try {
      const validated = insertTableSchema.parse(req.body);
      const table = await storage.createTable(validated);
      res.status(201).json(table);
    } catch (error) {
      res.status(400).json({ error: "Invalid table data" });
    }
  });

  app.patch("/api/tables/:id", async (req, res) => {
    try {
      const table = await storage.updateTable(req.params.id, req.body);
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to update table" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      const status = req.query.status as string | undefined;
      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }
      const orders = await storage.getOrders(locationId, status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Generate order number
      const orderNumber = `#${Date.now().toString().slice(-6)}`;
      const orderWithNumber = { ...orderData, orderNumber };
      
      const validatedOrder = insertOrderSchema.parse(orderWithNumber);
      const validatedItems = items.map((item: any) => insertOrderItemSchema.parse(item));
      
      const order = await storage.createOrder(validatedOrder, validatedItems);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Staff routes
  app.get("/api/staff", async (req, res) => {
    try {
      const locationId = req.query.locationId as string | undefined;
      const staff = await storage.getStaff(locationId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const validated = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(validated);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({ error: "Invalid staff data" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.updateStaff(req.params.id, req.body);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staff member" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Reservation routes
  app.get("/api/reservations", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }
      const reservations = await storage.getReservations(locationId);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  app.get("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservation" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const validated = insertReservationSchema.parse(req.body);
      const reservation = await storage.createReservation(validated);
      res.status(201).json(reservation);
    } catch (error) {
      res.status(400).json({ error: "Invalid reservation data" });
    }
  });

  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.updateReservation(req.params.id, req.body);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reservation" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validated);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByOrder(req.params.orderId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const locationId = req.query.locationId as string | undefined;
      const settings = await storage.getSettings(locationId);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validated = insertRestaurantSettingsSchema.parse(req.body);
      const settings = await storage.createSettings(validated);
      res.status(201).json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  app.patch("/api/settings/:id", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.params.id, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/sales", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }

      const salesData = await storage.getSalesData(locationId, startDate, endDate);
      res.json(salesData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
