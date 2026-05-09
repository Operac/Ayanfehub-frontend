export interface User {
  id: string;
  email: string | null;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR' | 'ARTISAN';
  preferredCurrency: 'NGN' | 'GBP' | 'USD' | 'EUR';
  whatsappOptedIn: boolean;
  createdAt: string;
  addresses?: DeliveryAddress[];
}

export interface DeliveryAddress {
  id: string;
  label: string | null;
  landmarkDescription: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  deliveryZone?: { id: string; name: string } | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFeeNgn: number;
}

export interface RunDay {
  id: string;
  dayOfWeek: number;
  cutoffHour: number;
  isMasterConsolidation: boolean;
}

export interface Market {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  phase: number;
  lat: number | null;
  lng: number | null;
  runDays?: RunDay[];
}

export interface Category {
  id: string;
  name: string;
}

export interface PriceEntry {
  id: string;
  priceNgn: number;
  unit: string;
  isCurrent: boolean;
}

export interface Vendor {
  id: string;
  businessName: string;
  isVerified: boolean;
  ratingAverage: number | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  unit: string;
  isActive: boolean;
  marketId: string;
  vendorId: string;
  categoryId: string | null;
  vendor?: Vendor;
  category?: Category | null;
  priceEntries?: PriceEntry[];
}

export interface ArtisanService {
  id: string;
  serviceName: string;
  description: string | null;
  priceNgn: number;
  durationHours: number | null;
}

export interface Artisan {
  id: string;
  name: string;
  category: string;
  bio: string | null;
  phone: string | null;
  portfolioImages: string[];
  isVerified: boolean;
  isAvailable: boolean;
  ratingAverage: number | null;
  services?: ArtisanService[];
  reviews?: Review[];
}

export interface Apartment {
  id: string;
  name: string;
  location: string;
  description: string | null;
  ratePerNight: number;
  images: string[];
  isAvailable: boolean;
  amenities: string[];
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'SOURCING'
  | 'AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_INITIATED';

export interface OrderItem {
  id: string;
  productId: string;
  vendorId: string;
  quantity: number;
  unitPriceNgn: number;
  subtotalNgn: number;
  product?: { id: string; name: string; imageUrl: string | null };
  vendor?: { id: string; businessName: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalNgn: number;
  createdAt: string;
  updatedAt: string;
  deliveryAddressId: string | null;
  specialInstructions: string | null;
  items?: OrderItem[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  userId: string;
  vendorId: string | null;
  artisanId: string | null;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { id: string; fullName: string | null; avatarUrl: string | null };
}

export interface SearchResults {
  products: Product[];
  markets: Market[];
}

export interface ApiError {
  message: string;
  errors?: { message: string; path: string[] }[];
}
