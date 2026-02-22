// Product / Inventory Item
export interface Product {
  id: string;
  barcode: string;
  tradeName: string;
  scientificName: string;
  stockQuantity: number;
  costPrice: number;
  salePrice: number;
  expiryDate: string;
  minStock: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Contact (Customer or Supplier)
export interface Contact {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  phone: string;
  email: string;
  address: string;
  balance: number;
  createdAt: string;
}

// Invoice Header
export interface Invoice {
  id: string;
  type: 'sale' | 'purchase';
  contactId: string;
  contactName: string;
  date: string;
  total: number;
  paid: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: InvoiceItem[];
  createdAt: string;
}

// Invoice Line Item
export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Ledger Entry
export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  balance: number;
  referenceId?: string;
  referenceType?: 'invoice' | 'payment' | 'adjustment';
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
}

// Insurance Customer
export interface InsuranceCustomer {
  id: string;
  name: string;
  cardNumber: string;
  phone: string;
  balance: number;
  createdAt: string;
}

// Insurance Sale
export interface InsuranceSale {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  date: string;
}

// Purchase Order
export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  status: 'pending' | 'completed';
}
