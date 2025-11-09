import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MenuItemCard } from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuItem, MenuCategory } from "@shared/schema";

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const saveMenuItem = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !price || !categoryId) {
        throw new Error("Please fill in all required fields");
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("Price must be a valid positive number");
      }
      
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum.toFixed(2),
        categoryId,
        imageUrl: imageUrl.trim() || null,
        available: true,
      };
      
      if (editingId) {
        return apiRequest("PATCH", `/api/menu-items/${editingId}`, data);
      } else {
        return apiRequest("POST", "/api/menu-items", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setOpen(false);
      setEditingId(null);
      setName("");
      setDescription("");
      setPrice("");
      setCategoryId("");
      setImageUrl("");
    },
    onError: (error: any) => {
      console.error("Failed to save menu item:", error);
      alert(error.message || "Failed to save menu item");
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete menu item:", error);
      alert("Failed to delete menu item");
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      return apiRequest("PATCH", `/api/menu-items/${id}`, { available: !available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
    },
  });

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setPrice(parseFloat(item.price).toFixed(2));
    setCategoryId(item.categoryId || "");
    setImageUrl(item.imageUrl || "");
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItem.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId("");
    setImageUrl("");
    setOpen(true);
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading menu items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items across all locations</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-item">
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
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} data-testid={`tab-${category.name.toLowerCase()}`}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                {...item}
                description={item.description || ""}
                price={`$${parseFloat(item.price).toFixed(2)}`}
                category={categories.find((c) => c.id === item.categoryId)?.name || ""}
                image={item.imageUrl || ""}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onToggleAvailability={() => toggleAvailability.mutate({ id: item.id, available: item.available })}
              />
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems
                .filter((item) => item.categoryId === category.id)
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    {...item}
                    description={item.description || ""}
                    price={`$${parseFloat(item.price).toFixed(2)}`}
                    category={category.name}
                    image={item.imageUrl || ""}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleAvailability={() => toggleAvailability.mutate({ id: item.id, available: item.available })}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the menu item details below." : "Create a new menu item. Name, price, and category are required."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="/assets/generated_images/your-image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Use paths like /assets/generated_images/image.png for images in the project
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMenuItem.mutate()}
              disabled={!name || !price || !categoryId || saveMenuItem.isPending}
            >
              {saveMenuItem.isPending ? "Saving..." : editingId ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
