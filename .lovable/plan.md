

# خطة تفعيل Supabase وإنشاء قاعدة البيانات

## ملخص
تحويل المشروع من بيانات وهمية (mock data) إلى قاعدة بيانات Supabase حقيقية مع تحويل الـ schema من SQL Server إلى PostgreSQL.

---

## المرحلة 1: تفعيل Supabase Cloud

تفعيل اتصال Lovable Cloud مع Supabase لإنشاء قاعدة بيانات تلقائيا.

## المرحلة 2: إنشاء جداول قاعدة البيانات (Migration)

تحويل جميع الجداول من T-SQL إلى PostgreSQL مع التعديلات التالية:

| SQL Server | PostgreSQL |
|---|---|
| UNIQUEIDENTIFIER + NEWID() | UUID + gen_random_uuid() |
| NVARCHAR(n) | TEXT |
| BIT | BOOLEAN |
| DATETIME2 | TIMESTAMPTZ |
| DECIMAL(18,2) | NUMERIC(18,2) |
| GETDATE() | now() |

### الجداول المطلوبة (بالترتيب):

1. **products** - المنتجات
2. **contacts** - جهات الاتصال (زبائن + موردين)
3. **insurance_customers** - عملاء التأمين
4. **invoices** - الفواتير (بيع/شراء)
5. **invoice_items** - تفاصيل الفواتير
6. **insurance_sales** - مبيعات التأمين
7. **ledger** - دفتر الحسابات
8. **treasury** - الخزينة
9. **settings** - إعدادات النظام

ملاحظة: جدول المستخدمين (users) سيعتمد على نظام Supabase Auth المدمج مع جدول profiles إضافي للصلاحيات.

### دوال مساعدة للصلاحيات:
- `get_user_role()` - إرجاع دور المستخدم الحالي
- `is_admin()` - هل المستخدم مدير؟
- `is_manager_or_admin()` - هل مدير أو مشرف؟

### سياسات أمان RLS:
- المنتجات وجهات الاتصال: قراءة لجميع المسجلين
- الفواتير: إنشاء للجميع، حذف للمدير فقط
- الخزينة ودفتر الحسابات: المدير والمشرف فقط
- الإعدادات والمستخدمين: المدير فقط

## المرحلة 3: إنشاء Supabase Client

إنشاء ملف `src/integrations/supabase/client.ts` لتهيئة الاتصال.

## المرحلة 4: تحديث Types

تحديث `src/types/index.ts` ليتوافق مع أسماء أعمدة PostgreSQL (snake_case):

- `tradeName` يصبح `trade_name`
- `stockQuantity` يصبح `stock_quantity`
- `costPrice` يصبح `cost_price`
- `salePrice` يصبح `sale_price`
- `expiryDate` يصبح `expiry_date`
- `minStock` يصبح `min_stock`
- `createdAt` يصبح `created_at`
- `updatedAt` يصبح `updated_at`
- `contactType` يصبح `contact_type`

وسيتم أيضا إنشاء ملف types تلقائي من Supabase في `src/integrations/supabase/types.ts`.

## المرحلة 5: تحديث جميع الصفحات

تحديث جميع الملفات التي تستخدم الـ types القديمة (camelCase) لتتوافق مع الأسماء الجديدة (snake_case):
- `src/pages/Products.tsx`
- `src/pages/POS.tsx`
- `src/pages/InsurancePOS.tsx`
- `src/pages/Purchases.tsx`
- `src/pages/Accounts.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Treasury.tsx`
- `src/pages/Reports.tsx`
- `src/pages/InsuranceCustomers.tsx`
- `src/components/products/ProductTable.tsx`
- `src/components/products/ProductModal.tsx`
- `src/components/accounts/AccountDetailsDialog.tsx`
- `src/components/insurance/InsuranceCustomerDialog.tsx`
- `src/components/purchases/SupplierModal.tsx`
- `src/components/dashboard/AlertCard.tsx`
- `src/components/dashboard/RecentTransactions.tsx`
- `src/data/mockData.ts`

---

## التفاصيل التقنية

### الملفات الجديدة
```text
src/integrations/supabase/client.ts   -- Supabase client
src/integrations/supabase/types.ts    -- أنواع البيانات التلقائية
```

### الملفات المعدلة
```text
src/types/index.ts                    -- تحديث الأسماء لـ snake_case
src/data/mockData.ts                  -- تحديث الأسماء
جميع الصفحات والمكونات               -- تحديث استخدام الأسماء الجديدة
```

### ملاحظة مهمة
في هذه المرحلة سيتم فقط:
1. إنشاء الجداول والاتصال
2. تحديث الـ Types
3. تحديث أسماء الحقول في جميع الملفات

ربط الصفحات فعليا بقاعدة البيانات (استبدال mock data بـ Supabase queries) سيكون في مرحلة لاحقة حتى لا يتعطل التطبيق.

