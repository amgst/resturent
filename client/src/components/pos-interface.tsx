import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Trash2, CreditCard } from "lucide-react";
import salmonImage from "@assets/generated_images/Signature_salmon_dish_d8e8f815.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_menu_item_9d9fa87c.png";
import burgerImage from "@assets/generated_images/Classic_burger_and_fries_87d1cbb1.png";
import saladImage from "@assets/generated_images/Caesar_salad_menu_item_a35f34ac.png";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export function POSInterface() {
  //todo: remove mock functionality
  const menuItems: MenuItem[] = [
    { id: "1", name: "Grilled Salmon", price: 24.99, category: "mains", image: salmonImage },
    { id: "2", name: "Margherita Pizza", price: 16.99, category: "mains", image: pizzaImage },
    { id: "3", name: "Classic Burger", price: 14.99, category: "mains", image: burgerImage },
    { id: "4", name: "Caesar Salad", price: 12.99, category: "appetizers", image: saladImage },
  ];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");

  const addToCart = (item: MenuItem) => {
    console.log("Adding to cart:", item.name);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    console.log("Updating quantity for item:", id, "delta:", delta);
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    console.log("Removing item:", id);
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mains">
              <TabsList className="mb-4">
                <TabsTrigger value="appetizers" data-testid="tab-appetizers">Appetizers</TabsTrigger>
                <TabsTrigger value="mains" data-testid="tab-mains">Mains</TabsTrigger>
                <TabsTrigger value="desserts" data-testid="tab-desserts">Desserts</TabsTrigger>
                <TabsTrigger value="drinks" data-testid="tab-drinks">Drinks</TabsTrigger>
              </TabsList>
              <TabsContent value="appetizers">
                <div className="grid sm:grid-cols-2 gap-3">
                  {menuItems
                    .filter((item) => item.category === "appetizers")
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="hover-elevate active-elevate-2 cursor-pointer"
                        onClick={() => addToCart(item)}
                        data-testid={`menu-item-${item.id}`}
                      >
                        <div className="aspect-video relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-t-md" />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.name}</h4>
                            <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="mains">
                <div className="grid sm:grid-cols-2 gap-3">
                  {menuItems
                    .filter((item) => item.category === "mains")
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="hover-elevate active-elevate-2 cursor-pointer"
                        onClick={() => addToCart(item)}
                        data-testid={`menu-item-${item.id}`}
                      >
                        <div className="aspect-video relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-t-md" />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.name}</h4>
                            <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="desserts">
                <p className="text-center text-muted-foreground py-8">No desserts available</p>
              </TabsContent>
              <TabsContent value="drinks">
                <p className="text-center text-muted-foreground py-8">No drinks available</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Current Order</CardTitle>
            <div className="mt-2">
              <Input
                placeholder="Table number..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                data-testid="input-table-number"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No items added</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, -1)}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, 1)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>${(total * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span data-testid="text-total">${(total * 1.1).toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={cart.length === 0} data-testid="button-checkout">
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
