import { Product, Contact, Invoice, LedgerEntry, DashboardStats } from '@/types';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    barcode: '6281001234567',
    tradeName: 'بانادول إكسترا',
    scientificName: 'Paracetamol 500mg + Caffeine 65mg',
    stockQuantity: 150,
    costPrice: 8.5,
    salePrice: 12.0,
    expiryDate: '2025-06-15',
    minStock: 20,
    category: 'مسكنات',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    barcode: '6281001234568',
    tradeName: 'أوجمنتين 625',
    scientificName: 'Amoxicillin + Clavulanic Acid',
    stockQuantity: 8,
    costPrice: 45.0,
    salePrice: 65.0,
    expiryDate: '2025-03-20',
    minStock: 15,
    category: 'مضادات حيوية',
    createdAt: '2024-02-10',
    updatedAt: '2024-11-28',
  },
  {
    id: '3',
    barcode: '6281001234569',
    tradeName: 'فولتارين جل',
    scientificName: 'Diclofenac Sodium 1%',
    stockQuantity: 45,
    costPrice: 22.0,
    salePrice: 32.0,
    expiryDate: '2026-01-10',
    minStock: 10,
    category: 'مسكنات موضعية',
    createdAt: '2024-03-05',
    updatedAt: '2024-12-10',
  },
  {
    id: '4',
    barcode: '6281001234570',
    tradeName: 'أموكسيل 500',
    scientificName: 'Amoxicillin 500mg',
    stockQuantity: 5,
    costPrice: 18.0,
    salePrice: 28.0,
    expiryDate: '2025-01-25',
    minStock: 20,
    category: 'مضادات حيوية',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-15',
  },
  {
    id: '5',
    barcode: '6281001234571',
    tradeName: 'زيرتك 10',
    scientificName: 'Cetirizine HCl 10mg',
    stockQuantity: 85,
    costPrice: 15.0,
    salePrice: 24.0,
    expiryDate: '2025-08-30',
    minStock: 15,
    category: 'مضادات الحساسية',
    createdAt: '2024-04-12',
    updatedAt: '2024-11-20',
  },
  {
    id: '6',
    barcode: '6281001234572',
    tradeName: 'موتيليوم',
    scientificName: 'Domperidone 10mg',
    stockQuantity: 3,
    costPrice: 12.0,
    salePrice: 18.0,
    expiryDate: '2025-02-10',
    minStock: 10,
    category: 'أدوية الجهاز الهضمي',
    createdAt: '2024-05-08',
    updatedAt: '2024-12-05',
  },
];

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'أحمد محمد العلي',
    type: 'customer',
    phone: '0501234567',
    email: 'ahmed@email.com',
    address: 'الرياض - حي النزهة',
    balance: 250.0,
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    name: 'شركة الدواء المتحدة',
    type: 'supplier',
    phone: '0112345678',
    email: 'info@dawaa.com',
    address: 'جدة - المنطقة الصناعية',
    balance: -5000.0,
    createdAt: '2024-01-05',
  },
  {
    id: '3',
    name: 'فاطمة خالد',
    type: 'customer',
    phone: '0559876543',
    email: 'fatima@email.com',
    address: 'الرياض - حي الملقا',
    balance: 0,
    createdAt: '2024-03-15',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    type: 'sale',
    contactId: '1',
    contactName: 'أحمد محمد العلي',
    date: '2024-12-20',
    total: 156.0,
    paid: 100.0,
    status: 'pending',
    items: [
      { id: '1', productId: '1', productName: 'بانادول إكسترا', quantity: 3, unitPrice: 12.0, total: 36.0 },
      { id: '2', productId: '3', productName: 'فولتارين جل', quantity: 2, unitPrice: 32.0, total: 64.0 },
      { id: '3', productId: '5', productName: 'زيرتك 10', quantity: 2, unitPrice: 24.0, total: 48.0 },
    ],
    createdAt: '2024-12-20T10:30:00',
  },
  {
    id: 'INV-002',
    type: 'sale',
    contactId: '3',
    contactName: 'فاطمة خالد',
    date: '2024-12-20',
    total: 84.0,
    paid: 84.0,
    status: 'completed',
    items: [
      { id: '1', productId: '1', productName: 'بانادول إكسترا', quantity: 2, unitPrice: 12.0, total: 24.0 },
      { id: '2', productId: '4', productName: 'أموكسيل 500', quantity: 2, unitPrice: 28.0, total: 56.0 },
    ],
    createdAt: '2024-12-20T14:15:00',
  },
];

// Mock Ledger Entries
export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: '1',
    date: '2024-12-20',
    description: 'مبيعات - فاتورة INV-002',
    type: 'income',
    amount: 84.0,
    balance: 15840.0,
    referenceId: 'INV-002',
    referenceType: 'invoice',
  },
  {
    id: '2',
    date: '2024-12-20',
    description: 'دفعة من العميل - أحمد محمد',
    type: 'income',
    amount: 100.0,
    balance: 15940.0,
    referenceId: 'INV-001',
    referenceType: 'payment',
  },
  {
    id: '3',
    date: '2024-12-19',
    description: 'مشتريات - شركة الدواء المتحدة',
    type: 'expense',
    amount: 2500.0,
    balance: 15756.0,
    referenceType: 'invoice',
  },
];

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalSalesToday: 1250.0,
  totalSalesMonth: 45680.0,
  totalProducts: mockProducts.length,
  lowStockCount: mockProducts.filter(p => p.stockQuantity <= p.minStock).length,
  expiringCount: mockProducts.filter(p => {
    const expiryDate = new Date(p.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  }).length,
  pendingInvoices: mockInvoices.filter(i => i.status === 'pending').length,
};

// Get low stock products
export const getLowStockProducts = () => 
  mockProducts.filter(p => p.stockQuantity <= p.minStock);

// Get expiring products (within 3 months)
export const getExpiringProducts = () => {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return mockProducts.filter(p => new Date(p.expiryDate) <= threeMonthsFromNow);
};
