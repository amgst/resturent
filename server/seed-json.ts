import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'restaurant-data.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const sampleData = {
  locations: [
    {
      id: "loc-1",
      name: "Main Restaurant",
      address: "123 Main St, New York, NY 10001",
      phone: "+1-555-0100",
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  menuCategories: [
    {
      id: "cat-1",
      name: "Appetizers",
      displayOrder: 1
    },
    {
      id: "cat-2",
      name: "Main Course",
      displayOrder: 2
    },
    {
      id: "cat-3",
      name: "Desserts",
      displayOrder: 3
    },
    {
      id: "cat-4",
      name: "Beverages",
      displayOrder: 4
    }
  ],
  menuItems: [
    {
      id: "item-1",
      name: "Caesar Salad",
      description: "Fresh romaine lettuce with parmesan and croutons",
      price: "12.99",
      categoryId: "cat-1",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-2",
      name: "Bruschetta",
      description: "Toasted bread with tomatoes and basil",
      price: "9.99",
      categoryId: "cat-1",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-3",
      name: "Grilled Salmon",
      description: "Atlantic salmon with seasonal vegetables",
      price: "28.99",
      categoryId: "cat-2",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-4",
      name: "Ribeye Steak",
      description: "12oz ribeye cooked to perfection",
      price: "34.99",
      categoryId: "cat-2",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-5",
      name: "Chocolate Cake",
      description: "Rich chocolate layer cake",
      price: "8.99",
      categoryId: "cat-3",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-6",
      name: "Tiramisu",
      description: "Classic Italian dessert",
      price: "9.99",
      categoryId: "cat-3",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-7",
      name: "Fresh Lemonade",
      description: "House-made lemonade",
      price: "4.99",
      categoryId: "cat-4",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "item-8",
      name: "Coffee",
      description: "Freshly brewed coffee",
      price: "2.99",
      categoryId: "cat-4",
      imageUrl: null,
      available: true,
      createdAt: new Date().toISOString()
    }
  ],
  areas: [
    {
      id: "area-1",
      locationId: "loc-1",
      name: "Main Dining",
      description: "Main dining area"
    },
    {
      id: "area-2",
      locationId: "loc-1",
      name: "Patio",
      description: "Outdoor seating"
    }
  ],
  tables: [
    {
      id: "table-1",
      locationId: "loc-1",
      areaId: "area-1",
      tableNumber: "1",
      capacity: 4,
      status: "available",
      currentPartySize: null,
      serverId: null
    },
    {
      id: "table-2",
      locationId: "loc-1",
      areaId: "area-1",
      tableNumber: "2",
      capacity: 2,
      status: "available",
      currentPartySize: null,
      serverId: null
    },
    {
      id: "table-3",
      locationId: "loc-1",
      areaId: "area-2",
      tableNumber: "3",
      capacity: 6,
      status: "available",
      currentPartySize: null,
      serverId: null
    }
  ],
  orders: [],
  orderItems: [],
  staff: [
    {
      id: "staff-1",
      name: "John Doe",
      email: "john@example.com",
      role: "server",
      locationId: "loc-1",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "staff-2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "chef",
      locationId: "loc-1",
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  customers: [],
  reservations: [],
  payments: [],
  restaurantSettings: [
    {
      id: "settings-1",
      locationId: "loc-1",
      restaurantName: "The Gourmet Restaurant",
      logoUrl: null,
      primaryColor: "#ea580c",
      tagline: "Fine Dining Experience",
      taxRate: "0.10",
      currency: "USD",
      updatedAt: new Date().toISOString()
    }
  ]
};

writeFileSync(DATA_FILE, JSON.stringify(sampleData, null, 2));
console.log('Seed data created successfully!');
