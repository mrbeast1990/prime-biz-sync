// Product / Inventory Item
export interface Product {
  id: string;
  barcode: string;
  trade_name: string;
  scientific_name: string;
  stock_quantity: number;
  cost_price: number;
  sale_price: number;
  expiry_date: string;
  min_stock: number;
  category: string;
  packaging_type: string;
  units_per_package: number;
  has_expiry: boolean;
  image_url?: string;
  is_active?: boolean;
  batch_number?: string;
  created_at: string;
  updated_at: string;
}

// Contact (Customer or Supplier)
export interface Contact {
  id: string;
  name: string;
  contact_type: 'customer' | 'supplier';
  phone: string;
  email: string;
  address: string;
  balance: number;
  created_at: string;
  updated_at?: string;
}

// Invoice Header
export interface Invoice {
  id: string;
  invoice_number?: string;
  invoice_type: 'sale' | 'purchase';
  contact_id: string;
  contact_name: string;
  invoice_date: string;
  total: number;
  paid: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at?: string;
}

// Invoice Line Item
export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Ledger Entry
export interface LedgerEntry {
  id: string;
  entry_date: string;
  description: string;
  entry_type: 'income' | 'expense';
  amount: number;
  running_balance: number;
  reference_id?: string;
  reference_type?: string;
  contact_id?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalSalesToday: number;
  totalSalesMonth: number;
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  pendingInvoices: number;
}

// Cart Item for POS
export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
  unit_type?: 'package' | 'unit';
}

export type SaleMode = 'cash' | 'card' | 'credit' | 'return' | 'damage';

// Insurance Customer
export interface InsuranceCustomer {
  id: string;
  name: string;
  card_number: string;
  phone: string;
  balance: number;
  created_at: string;
  updated_at?: string;
}

// Insurance Sale
export interface InsuranceSale {
  id: string;
  customer_id: string;
  customer_name: string;
  items: CartItem[];
  total: number;
  sale_date: string;
}

// Purchase Order
export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  status: 'pending' | 'completed';
}

// Treasury Entry
export interface TreasuryEntry {
  id: string;
  entry_date: string;
  entry_type: 'income' | 'expense' | 'deposit' | 'withdrawal';
  category: 'sales' | 'insurance_sales' | 'purchases' | 'manual';
  description: string;
  amount: number;
  running_balance: number;
  reference_id?: string;
}

// Pharmacy Settings
export interface PharmacySettings {
  name: string;
  phone: string;
  address: string;
  receiptSize: 'A4' | '80mm' | '58mm';
}
