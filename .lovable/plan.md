

# خطة شاملة: نظام الاستجابة + تحسينات الطباعة والاستيراد

## 1. نظام الاستجابة (Responsive) — جميع الصفحات

### 1.1 القائمة الجانبية (Sidebar + Header)
**الملفات:** `Sidebar.tsx`, `Header.tsx`, `MainLayout.tsx`, `SidebarContext.tsx`

- **موبايل (< 768px):** إخفاء Sidebar تماماً + إضافة زر Hamburger (☰) في Header يفتح Sheet/Drawer من اليمين
- **لابتوب:** تبقى كما هي (ثابتة مع F2 للطي)
- استخدام `useIsMobile()` الموجود في `use-mobile.tsx`
- في `MainLayout`: إزالة `mr-64/mr-20` على الموبايل (لأن الـ Sidebar تختفي)
- في `Header`: إضافة `Menu` icon يظهر فقط على `md:hidden` ويفتح Sheet يحتوي روابط القائمة

### 1.2 الجداول → بطاقات متكررة على الموبايل
**الصفحات المتأثرة:** Accounts, Reports, Treasury, Users, InsuranceCustomers, Products (ProductTable)

- إنشاء نمط مشترك: على `md` وأكبر يظهر الجدول، على الموبايل تظهر بطاقات (cards)
- كل بطاقة تعرض البيانات بشكل عمودي مع labels واضحة
- استخدام `hidden md:block` للجدول و `md:hidden` للبطاقات

### 1.3 Grid Layouts → تكديس عمودي
**الصفحات:** Dashboard (`md:grid-cols-5` → `grid-cols-2`), Reports (`lg:grid-cols-4` → `grid-cols-2`), Treasury, Settings

- معظمها تستخدم `grid-cols-1 md:grid-cols-X` بالفعل
- Dashboard: `md:grid-cols-5` → `grid-cols-2 md:grid-cols-5` (مع العنصر الخامس يأخذ `col-span-2` على الموبايل)

### 1.4 POS & Forms → كامل العرض على الموبايل
**الصفحات:** POS, InsurancePOS, Purchases

- POS: `lg:grid-cols-12` → على الموبايل عمود واحد، مع السلة أعلى والبحث أسفل (أو tabs)
- Purchases: `lg:grid-cols-3` → عمود واحد على الموبايل
- الأزرار والـ inputs تأخذ `w-full` على الموبايل

---

## 2. طباعة PDF من بطاقة الصنف — خيار اختيار الأصناف

### 2.1 نافذة اختيار الأصناف للطباعة
**ملف جديد:** `src/components/products/PrintSelectDialog.tsx`

- Dialog يظهر عند الضغط على "طباعة PDF"
- قائمة بكل الأصناف مع checkbox لكل صنف
- زر "تحديد الكل" / "إلغاء التحديد"
- زر "طباعة المحدد"

### 2.2 تعديل أعمدة الطباعة
**الملف:** `src/utils/printUtils.ts` → `printProductsTable`

- استبدال عمود "الكود" بـ "Batch No" (`batch_number`)
- إزالة عمود "سعر البيع"
- عمود الصلاحية: عرض تاريخ الصلاحية الفعلي (`expiry_date`) بدلاً من "خاضع للصلاحية". إذا لا يوجد تاريخ يُكتب "—"

### 2.3 ربط الـ Dialog بصفحة Products
**الملف:** `src/pages/Products.tsx`

- `handlePrintPDF` يفتح `PrintSelectDialog` بدلاً من طباعة مباشرة

---

## 3. تحسين الاستيراد — تعديل صنف بصنف

### 3.1 تعديل `ImportPreviewDialog`
**الملف:** `src/components/products/ImportPreviewDialog.tsx`

- بدلاً من جدول كبير، عرض صنف واحد في كل مرة بتصميم مشابه لـ ProductModal
- عرض index / total (مثل "3 / 15")
- أزرار: "حفظ والتالي" ← ينتقل للصنف التالي تلقائياً
- زر "تخطي" للانتقال بدون حفظ
- زر "حفظ الكل المتبقي" لحفظ البقية دفعة واحدة
- كل حقل يظهر بنفس ترتيب ProductModal مع ملء تلقائي من البيانات المستوردة

### 3.2 نفس المنطق في المشتريات
**الملف:** `src/pages/Purchases.tsx`

- إضافة زر "استيراد" في صفحة المشتريات
- عند رفع ملف، نفس تجربة التعديل صنف بصنف
- بعد الحفظ، الأصناف تُضاف لفاتورة المشتريات الحالية

---

## 4. أرشفة الأصناف ذات الكمية الصفرية

**الصفحات المتأثرة:** Products (✅ موجود), POS (✅ موجود عبر البحث), InsurancePOS, Purchases

- `Products.tsx`: سطر 50 يخفي الصفرية بالفعل ✅
- `POS.tsx`: سطر 116 يعرض فقط عند البحث ✅
- `InsurancePOS.tsx`: يجب إضافة فلتر لإخفاء `stock_quantity === 0`
- `Purchases.tsx`: الصفرية تظهر في المشتريات وهذا صحيح (لأنك تشتري لتعبئة المخزون)

---

## 5. إخفاء أصناف البيع للتأمين — تظهر فقط عند البحث

**الملف:** `src/pages/InsurancePOS.tsx`

- حالياً `filteredProducts` تُظهر كل الأصناف حتى بدون بحث
- التعديل: إضافة شرط `searchQuery.length > 0` قبل عرض قائمة الأصناف (مثل POS.tsx سطر 115)
- إخفاء الأصناف ذات الكمية الصفرية من النتائج

---

## الملفات المتأثرة (ملخص)

| الملف | التغيير |
|-------|---------|
| `SidebarContext.tsx` | إضافة `isMobileOpen` + `toggleMobileSidebar` |
| `Sidebar.tsx` | لف المحتوى بـ Sheet على الموبايل |
| `Header.tsx` | إضافة زر Hamburger على الموبايل |
| `MainLayout.tsx` | إزالة margin على الموبايل |
| `ProductTable.tsx` | إضافة عرض بطاقات على الموبايل |
| `Accounts.tsx` | بطاقات موبايل للجداول الثلاثة |
| `Reports.tsx` | بطاقات + grid responsive |
| `Treasury.tsx` | بطاقات موبايل |
| `Users.tsx` | بطاقات موبايل |
| `InsuranceCustomers.tsx` | بطاقات موبايل |
| `Dashboard.tsx` | grid responsive |
| `POS.tsx` | تكديس عمودي + أزرار كاملة العرض |
| `InsurancePOS.tsx` | تكديس + إخفاء أصناف حتى البحث + فلتر صفري |
| `Purchases.tsx` | تكديس عمودي + استيراد |
| `Settings.tsx` | grid templates responsive |
| `PrintSelectDialog.tsx` | ملف جديد — نافذة اختيار أصناف للطباعة |
| `ImportPreviewDialog.tsx` | إعادة تصميم — تعديل صنف بصنف |
| `printUtils.ts` | تعديل أعمدة الطباعة |
| `Products.tsx` | ربط PrintSelectDialog |

