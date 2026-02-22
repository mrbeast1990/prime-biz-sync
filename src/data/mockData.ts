import { Product, Contact, Invoice, LedgerEntry, DashboardStats, InsuranceCustomer, InsuranceSale, PurchaseOrder, TreasuryEntry } from '@/types';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    barcode: '6281',
    trade_name: 'بانادول إكسترا',
    scientific_name: 'Paracetamol 500mg + Caffeine 65mg',
    stock_quantity: 150,
    cost_price: 8.5,
    sale_price: 12.0,
    expiry_date: '2025-06-15',
    min_stock: 20,
    category: 'مسكنات',
    packaging_type: 'علبة',
    units_per_package: 2,
    has_expiry: true,
    created_at: '2024-01-15',
    updated_at: '2024-12-01',
  },
  {
    id: '2',
    barcode: '6282',
    trade_name: 'أوجمنتين 625',
    scientific_name: 'Amoxicillin + Clavulanic Acid',
    stock_quantity: 8,
    cost_price: 45.0,
    sale_price: 65.0,
    expiry_date: '2025-03-20',
    min_stock: 15,
    category: 'مضادات حيوية',
    packaging_type: 'علبة',
    units_per_package: 1,
    has_expiry: true,
    created_at: '2024-02-10',
    updated_at: '2024-11-28',
  },
  {
    id: '3',
    barcode: '6283',
    trade_name: 'فولتارين جل',
    scientific_name: 'Diclofenac Sodium 1%',
    stock_quantity: 45,
    cost_price: 22.0,
    sale_price: 32.0,
    expiry_date: '2026-01-10',
    min_stock: 10,
    category: 'مسكنات موضعية',
    packaging_type: 'أنبوب',
    units_per_package: 1,
    has_expiry: true,
    created_at: '2024-03-05',
    updated_at: '2024-12-10',
  },
  {
    id: '4',
    barcode: '6284',
    trade_name: 'أموكسيل 500',
    scientific_name: 'Amoxicillin 500mg',
    stock_quantity: 5,
    cost_price: 18.0,
    sale_price: 28.0,
    expiry_date: '2025-01-25',
    min_stock: 20,
    category: 'مضادات حيوية',
    packaging_type: 'علبة',
    units_per_package: 3,
    has_expiry: true,
    created_at: '2024-01-20',
    updated_at: '2024-12-15',
  },
  {
    id: '5',
    barcode: '6285',
    trade_name: 'زيرتك 10',
    scientific_name: 'Cetirizine HCl 10mg',
    stock_quantity: 85,
    cost_price: 15.0,
    sale_price: 24.0,
    expiry_date: '2025-08-30',
    min_stock: 15,
    category: 'مضادات الحساسية',
    packaging_type: 'علبة',
    units_per_package: 1,
    has_expiry: true,
    created_at: '2024-04-12',
    updated_at: '2024-11-20',
  },
  {
    id: '6',
    barcode: '6286',
    trade_name: 'موتيليوم',
    scientific_name: 'Domperidone 10mg',
    stock_quantity: 3,
    cost_price: 12.0,
    sale_price: 18.0,
    expiry_date: '2025-02-10',
    min_stock: 10,
    category: 'أدوية الجهاز الهضمي',
    packaging_type: 'شريط',
    units_per_package: 1,
    has_expiry: false,
    created_at: '2024-05-08',
    updated_at: '2024-12-05',
  },
];

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'أحمد محمد العلي',
    contact_type: 'customer',
    phone: '0501234567',
    email: 'ahmed@email.com',
    address: 'الرياض - حي النزهة',
    balance: 250.0,
    created_at: '2024-01-10',
  },
  {
    id: '2',
    name: 'شركة الدواء المتحدة',
    contact_type: 'supplier',
    phone: '0112345678',
    email: 'info@dawaa.com',
    address: 'جدة - المنطقة الصناعية',
    balance: -5000.0,
    created_at: '2024-01-05',
  },
  {
    id: '3',
    name: 'فاطمة خالد',
    contact_type: 'customer',
    phone: '0559876543',
    email: 'fatima@email.com',
    address: 'الرياض - حي الملقا',
    balance: 0,
    created_at: '2024-03-15',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoice_type: 'sale',
    contact_id: '1',
    contact_name: 'أحمد محمد العلي',
    invoice_date: '2024-12-20',
    total: 156.0,
    paid: 100.0,
    status: 'pending',
    items: [
      { id: '1', product_id: '1', product_name: 'بانادول إكسترا', quantity: 3, unit_price: 12.0, total: 36.0 },
      { id: '2', product_id: '3', product_name: 'فولتارين جل', quantity: 2, unit_price: 32.0, total: 64.0 },
      { id: '3', product_id: '5', product_name: 'زيرتك 10', quantity: 2, unit_price: 24.0, total: 48.0 },
    ],
    created_at: '2024-12-20T10:30:00',
  },
  {
    id: 'INV-002',
    invoice_type: 'sale',
    contact_id: '3',
    contact_name: 'فاطمة خالد',
    invoice_date: '2024-12-20',
    total: 84.0,
    paid: 84.0,
    status: 'completed',
    items: [
      { id: '1', product_id: '1', product_name: 'بانادول إكسترا', quantity: 2, unit_price: 12.0, total: 24.0 },
      { id: '2', product_id: '4', product_name: 'أموكسيل 500', quantity: 2, unit_price: 28.0, total: 56.0 },
    ],
    created_at: '2024-12-20T14:15:00',
  },
];

// Mock Ledger Entries
export const mockLedgerEntries: LedgerEntry[] = [
  { id: '1', entry_date: '2024-12-20', description: 'مبيعات - فاتورة INV-002', entry_type: 'income', amount: 84.0, running_balance: 15840.0, reference_id: 'INV-002', reference_type: 'invoice' },
  { id: '2', entry_date: '2024-12-20', description: 'دفعة من العميل - أحمد محمد', entry_type: 'income', amount: 100.0, running_balance: 15940.0, reference_id: 'INV-001', reference_type: 'payment' },
  { id: '3', entry_date: '2024-12-19', description: 'مشتريات - شركة الدواء المتحدة', entry_type: 'expense', amount: 2500.0, running_balance: 15756.0, reference_type: 'invoice' },
];

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalSalesToday: 1250.0,
  totalSalesMonth: 45680.0,
  totalProducts: mockProducts.length,
  lowStockCount: mockProducts.filter(p => p.stock_quantity <= p.min_stock).length,
  expiringCount: mockProducts.filter(p => {
    if (!p.has_expiry) return false;
    const expiryDate = new Date(p.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  }).length,
  pendingInvoices: mockInvoices.filter(i => i.status === 'pending').length,
};

export const getLowStockProducts = () =>
  mockProducts.filter(p => p.stock_quantity <= p.min_stock);

export const getExpiringProducts = () => {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return mockProducts.filter(p => p.has_expiry && new Date(p.expiry_date) <= threeMonthsFromNow);
};

// Mock Insurance Customers
export const mockInsuranceCustomers: InsuranceCustomer[] = [
  { id: '1', name: 'عبدالله سعيد', card_number: 'INS-001', phone: '0501112233', balance: 320.0, created_at: '2024-11-01' },
  { id: '2', name: 'نورة الحربي', card_number: 'INS-002', phone: '0559998877', balance: 150.0, created_at: '2024-11-15' },
  { id: '3', name: 'خالد العتيبي', card_number: 'INS-003', phone: '0534445566', balance: 0, created_at: '2024-12-01' },
];

// Mock Insurance Sales
export const mockInsuranceSales: InsuranceSale[] = [
  { id: 'IS-001', customer_id: '1', customer_name: 'عبدالله سعيد', items: [], total: 120.0, sale_date: '2024-12-20' },
  { id: 'IS-002', customer_id: '2', customer_name: 'نورة الحربي', items: [], total: 85.0, sale_date: '2024-12-21' },
];

// Mock Purchase Orders
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-001',
    supplier_id: '2',
    supplier_name: 'شركة الدواء المتحدة',
    items: [
      { id: '1', product_id: '1', product_name: 'بانادول إكسترا', quantity: 100, unit_price: 8.5, total: 850 },
      { id: '2', product_id: '2', product_name: 'أوجمنتين 625', quantity: 50, unit_price: 45, total: 2250 },
    ],
    total: 3100,
    date: '2024-12-15',
    status: 'completed',
  },
];

// Mock Treasury Entries
export const mockTreasuryEntries: TreasuryEntry[] = [
  { id: 'T-001', entry_date: '2024-12-20', entry_type: 'income', category: 'sales', description: 'مبيعات نقدية - فاتورة INV-002', amount: 84.0, running_balance: 15940.0, reference_id: 'INV-002' },
  { id: 'T-002', entry_date: '2024-12-20', entry_type: 'income', category: 'sales', description: 'دفعة من العميل أحمد محمد', amount: 100.0, running_balance: 16040.0, reference_id: 'INV-001' },
  { id: 'T-003', entry_date: '2024-12-20', entry_type: 'income', category: 'insurance_sales', description: 'مبيعات تأمين - عبدالله سعيد', amount: 120.0, running_balance: 16160.0, reference_id: 'IS-001' },
  { id: 'T-004', entry_date: '2024-12-21', entry_type: 'income', category: 'insurance_sales', description: 'مبيعات تأمين - نورة الحربي', amount: 85.0, running_balance: 16245.0, reference_id: 'IS-002' },
  { id: 'T-005', entry_date: '2024-12-19', entry_type: 'expense', category: 'purchases', description: 'مشتريات - شركة الدواء المتحدة', amount: 3100.0, running_balance: 13145.0, reference_id: 'PO-001' },
  { id: 'T-006', entry_date: '2024-12-18', entry_type: 'withdrawal', category: 'manual', description: 'سحب نقدي - مصاريف عامة', amount: 500.0, running_balance: 12645.0 },
];
