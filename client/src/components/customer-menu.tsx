import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus } from "lucide-react";
import heroImage from "@assets/generated_images/Restaurant_interior_hero_image_fda54eae.png";
import salmonImage from "@assets/generated_images/Signature_salmon_dish_d8e8f815.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_menu_item_9d9fa87c.png";
import burgerImage from "@assets/generated_images/Classic_burger_and_fries_87d1cbb1.png";
import saladImage from "@assets/generated_images/Caesar_salad_menu_item_a35f34ac.png";
import cakeImage from "@assets/generated_images/Chocolate_lava_cake_dessert_5b5aa89d.png";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export function CustomerMenu() {
  //todo: remove mock functionality
  const [cartCount, setCartCount] = useState(0);

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon with lemon butter sauce",
      price: 24.99,
      category: "mains",
      image: salmonImage,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      description: "Wood-fired pizza with fresh mozzarella and basil",
      price: 16.99,
      category: "mains",
      image: pizzaImage,
    },
    {
      id: "3",
      name: "Classic Burger",
      description: "Angus beef with cheddar, lettuce, and fries",
      price: 14.99,
      category: "mains",
      image: burgerImage,
    },
    {
      id: "4",
      name: "Caesar Salad",
      description: "Crisp romaine with parmesan and croutons",
      price: 12.99,
      category: "appetizers",
      image: saladImage,
    },
    {
      id: "5",
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with vanilla ice cream",
      price: 8.99,
      category: "desserts",
      image: cakeImage,
    },
  ];

  const addToCart = (itemName: string) => {
    console.log("Added to cart:", itemName);
    setCartCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 md:h-96">
        <img src={heroImage} alt="Restaurant" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 flex items-end">
          <div className="p-6 text-white w-full">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">The Fine Dining</h1>
            <p className="text-lg text-white/90">Experience culinary excellence</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="mains" className="mb-8">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="appetizers" data-testid="tab-appetizers">Appetizers</TabsTrigger>
            <TabsTrigger value="mains" data-testid="tab-mains">Main Courses</TabsTrigger>
            <TabsTrigger value="desserts" data-testid="tab-desserts">Desserts</TabsTrigger>
            <TabsTrigger value="drinks" data-testid="tab-drinks">Drinks</TabsTrigger>
          </TabsList>

          <TabsContent value="appetizers">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.category === "appetizers")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden" data-testid={`menu-item-${item.id}`}>
                    <div className="aspect-square relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                        <Button onClick={() => addToCart(item.name)} data-testid={`button-add-${item.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="mains">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.category === "mains")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden" data-testid={`menu-item-${item.id}`}>
                    <div className="aspect-square relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                        <Button onClick={() => addToCart(item.name)} data-testid={`button-add-${item.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="desserts">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.category === "desserts")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden" data-testid={`menu-item-${item.id}`}>
                    <div className="aspect-square relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                        <Button onClick={() => addToCart(item.name)} data-testid={`button-add-${item.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="drinks">
            <p className="text-center text-muted-foreground py-12">Coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <Button size="lg" className="rounded-full shadow-lg" data-testid="button-view-cart">
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({cartCount})
          </Button>
        </div>
      )}
    </div>
  );
}
