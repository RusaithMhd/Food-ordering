export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  preparation_time_minutes: number;
  is_vegetarian: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}
