import { MenuItemCard } from "../menu-item-card";
import salmonImage from "@assets/generated_images/Signature_salmon_dish_d8e8f815.png";

export default function MenuItemCardExample() {
  return (
    <div className="max-w-sm">
      <MenuItemCard
        id="1"
        name="Grilled Salmon"
        description="Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables"
        price="$24.99"
        category="Main Course"
        image={salmonImage}
        available={true}
      />
    </div>
  );
}
