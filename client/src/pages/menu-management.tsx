import { useState } from "react";
import { MenuItemCard } from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import salmonImage from "@assets/generated_images/Signature_salmon_dish_d8e8f815.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_menu_item_9d9fa87c.png";
import burgerImage from "@assets/generated_images/Classic_burger_and_fries_87d1cbb1.png";
import saladImage from "@assets/generated_images/Caesar_salad_menu_item_a35f34ac.png";
import cakeImage from "@assets/generated_images/Chocolate_lava_cake_dessert_5b5aa89d.png";

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const menuItems = [
    {
      id: "1",
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables",
      price: "$24.99",
      category: "Main Course",
      image: salmonImage,
      available: true,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      description: "Wood-fired pizza with fresh mozzarella, basil, and San Marzano tomatoes",
      price: "$16.99",
      category: "Main Course",
      image: pizzaImage,
      available: true,
    },
    {
      id: "3",
      name: "Classic Burger",
      description: "Angus beef with cheddar, lettuce, tomato, and crispy fries",
      price: "$14.99",
      category: "Main Course",
      image: burgerImage,
      available: false,
    },
    {
      id: "4",
      name: "Caesar Salad",
      description: "Crisp romaine lettuce with parmesan, croutons, and Caesar dressing",
      price: "$12.99",
      category: "Appetizer",
      image: saladImage,
      available: true,
    },
    {
      id: "5",
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with molten center and vanilla ice cream",
      price: "$8.99",
      category: "Dessert",
      image: cakeImage,
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items across all locations</p>
        </div>
        <Button data-testid="button-add-item">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Items</TabsTrigger>
          <TabsTrigger value="appetizers" data-testid="tab-appetizers">Appetizers</TabsTrigger>
          <TabsTrigger value="mains" data-testid="tab-mains">Main Courses</TabsTrigger>
          <TabsTrigger value="desserts" data-testid="tab-desserts">Desserts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appetizers" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems
              .filter((item) => item.category === "Appetizer")
              .map((item) => (
                <MenuItemCard key={item.id} {...item} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="mains" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems
              .filter((item) => item.category === "Main Course")
              .map((item) => (
                <MenuItemCard key={item.id} {...item} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="desserts" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems
              .filter((item) => item.category === "Dessert")
              .map((item) => (
                <MenuItemCard key={item.id} {...item} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
