import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create default location
    const location = await storage.createLocation({
      name: "Downtown",
      address: "123 Main Street, Downtown",
      phone: "+1 234-567-8900",
      active: true,
    });
    console.log("✓ Created location:", location.name);

    // Create additional locations
    await storage.createLocation({
      name: "West Side",
      address: "456 West Avenue",
      phone: "+1 234-567-8901",
      active: true,
    });

    await storage.createLocation({
      name: "North End",
      address: "789 North Boulevard",
      phone: "+1 234-567-8902",
      active: true,
    });

    // Create menu categories
    const appetizers = await storage.createMenuCategory({
      name: "Appetizers",
      displayOrder: 1,
    });

    const mains = await storage.createMenuCategory({
      name: "Main Courses",
      displayOrder: 2,
    });

    const desserts = await storage.createMenuCategory({
      name: "Desserts",
      displayOrder: 3,
    });

    const drinks = await storage.createMenuCategory({
      name: "Drinks",
      displayOrder: 4,
    });
    console.log("✓ Created menu categories");

    // Create menu items
    await storage.createMenuItem({
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables",
      price: "24.99",
      categoryId: mains.id,
      imageUrl: "/assets/generated_images/Signature_salmon_dish_d8e8f815.png",
      available: true,
    });

    await storage.createMenuItem({
      name: "Margherita Pizza",
      description: "Wood-fired pizza with fresh mozzarella, basil, and San Marzano tomatoes",
      price: "16.99",
      categoryId: mains.id,
      imageUrl: "/assets/generated_images/Margherita_pizza_menu_item_9d9fa87c.png",
      available: true,
    });

    await storage.createMenuItem({
      name: "Classic Burger",
      description: "Angus beef with cheddar, lettuce, tomato, and crispy fries",
      price: "14.99",
      categoryId: mains.id,
      imageUrl: "/assets/generated_images/Classic_burger_and_fries_87d1cbb1.png",
      available: true,
    });

    await storage.createMenuItem({
      name: "Caesar Salad",
      description: "Crisp romaine lettuce with parmesan, croutons, and Caesar dressing",
      price: "12.99",
      categoryId: appetizers.id,
      imageUrl: "/assets/generated_images/Caesar_salad_menu_item_a35f34ac.png",
      available: true,
    });

    await storage.createMenuItem({
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with molten center and vanilla ice cream",
      price: "8.99",
      categoryId: desserts.id,
      imageUrl: "/assets/generated_images/Chocolate_lava_cake_dessert_5b5aa89d.png",
      available: true,
    });
    console.log("✓ Created menu items");

    // Create areas
    const mainDining = await storage.createArea({
      locationId: location.id,
      name: "Main Dining",
      description: "Primary dining area",
    });

    const patio = await storage.createArea({
      locationId: location.id,
      name: "Patio",
      description: "Outdoor seating",
    });
    console.log("✓ Created areas");

    // Create staff
    const sarah = await storage.createStaff({
      name: "Sarah Martinez",
      email: "sarah@restaurant.com",
      role: "server",
      locationId: location.id,
      active: true,
    });

    const mike = await storage.createStaff({
      name: "Mike Davis",
      email: "mike@restaurant.com",
      role: "chef",
      locationId: location.id,
      active: true,
    });

    await storage.createStaff({
      name: "Emma Lopez",
      email: "emma@restaurant.com",
      role: "server",
      locationId: location.id,
      active: true,
    });

    await storage.createStaff({
      name: "John Manager",
      email: "john@restaurant.com",
      role: "manager",
      locationId: location.id,
      active: true,
    });
    console.log("✓ Created staff");

    // Create tables
    for (let i = 1; i <= 12; i++) {
      const capacity = i <= 4 ? 2 : i <= 8 ? 4 : i <= 10 ? 6 : 8;
      const areaId = i % 2 === 0 ? mainDining.id : patio.id;
      const status = i <= 3 ? ("occupied" as const) : i === 4 ? ("reserved" as const) : ("available" as const);

      await storage.createTable({
        locationId: location.id,
        areaId,
        tableNumber: i.toString(),
        capacity,
        status,
        currentPartySize: status === "occupied" ? capacity - 1 : null,
        serverId: status === "occupied" ? sarah.id : null,
      });
    }
    console.log("✓ Created tables");

    // Create customers
    await storage.createCustomer({
      name: "Alice Johnson",
      email: "alice@email.com",
      phone: "+1 234-567-8901",
      notes: "Prefers window seating",
    });

    await storage.createCustomer({
      name: "Bob Wilson",
      email: "bob@email.com",
      phone: "+1 234-567-8902",
    });

    await storage.createCustomer({
      name: "Carol Martinez",
      email: "carol@email.com",
      phone: "+1 234-567-8903",
    });
    console.log("✓ Created customers");

    // Create restaurant settings
    await storage.createSettings({
      locationId: location.id,
      restaurantName: "The Fine Dining",
      logoUrl: null,
      primaryColor: "#ea580c",
      tagline: "Experience culinary excellence",
      taxRate: "0.10",
      currency: "USD",
    });
    console.log("✓ Created restaurant settings");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
