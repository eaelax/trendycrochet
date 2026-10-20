export interface Pattern {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  pdf_size: string; // e.g. "3.8 MB"
  difficulty_tag: string; // Default: "Beginner Friendly"
  cpa_locker_url: string; // Unique CPA link
  gumroad_url?: string; // Optional direct Gumroad purchase link
  is_hot?: boolean; // Toggles "HOT" badge on card
  is_best_seller?: boolean; // Toggles "BEST SELLER" badge on card
  is_published: boolean;
  created_at: string;
  description?: string;
  size?: string;
  rating?: number;
  reviews_count?: number;
}

export interface PatternFormData {
  title: string;
  slug?: string;
  image_url: string;
  pdf_size: string;
  difficulty_tag?: string;
  cpa_locker_url: string;
  gumroad_url?: string;
  is_hot?: boolean;
  is_best_seller?: boolean;
  is_published?: boolean;
  description?: string;
  rating?: number;
  reviews_count?: number;
}
