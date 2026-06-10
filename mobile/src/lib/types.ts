export interface User { id: number; name: string; email: string }
export interface Category { id: number; name: string; icon: string }
export interface MenuItem {
  id: number; category_id: number; name: string; description: string;
  price: number; image_url: string; rating: number; is_available: number;
}
export interface ItemOption {
  id: number; menu_item_id: number; kind: "size" | "extra"; name: string; price_delta: number;
}
export interface Review { rating: number; comment: string; created_at: string; user_name: string }
export interface MenuItemDetail extends MenuItem { options: ItemOption[]; reviews: Review[] }
export interface Address {
  id: number; label: string; street: string; city: string; is_default: number;
}
export type OrderStatus = "placed" | "preparing" | "on_the_way" | "delivered";
export interface OrderItem {
  id: number; menu_item_id: number; name: string; unit_price: number; quantity: number;
  selected_options: { id: number; name: string; price_delta: number }[];
}
export interface Order {
  id: number; status: OrderStatus; payment_method: "cash" | "card";
  subtotal: number; discount: number; delivery_fee: number; total: number;
  discount_code: string | null; created_at: string;
  items: OrderItem[]; address: Address | null;
}
