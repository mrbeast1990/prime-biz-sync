

# خطة تنفيذ: الشراء السريع + تاريخ التأمين + البيع بالتجزئة + إصلاح Dashboard

هذه الخطة تتضمن 4 مهام رئيسية. سأشرح كل واحدة بتفصيل.

---

## 1. الشراء السريع عند نقص المخزون (InsurancePOS)

**المكونات الجديدة:**
- إنشاء `src/components/insurance/QuickPurchaseModal.tsx` — نافذة تحتوي على: رقم فاتورة تلقائي (T-XXXX قابل للتعديل)، الكمية، تاريخ الصلاحية، سعر الشراء، سعر البيع.

**التعديلات:**
- **`InsurancePOS.tsx`**: تعديل `addToCart` — إذا كان `stock_quantity === 0`، بدلاً من المنع، يظهر confirm dialog "الكمية صفر، هل تريد إضافة مشتريات سريعة؟". عند الموافقة يفتح QuickPurchaseModal.
- **المورد التلقائي**: عند الحفظ، يبحث عن مورد باسم "مشتريات سريعة" في contacts. إن لم يجده، ينشئه تلقائياً.
- **عند الحفظ في QuickPurchaseModal**:
  1. تحديث `products` (stock_quantity, cost_price, sale_price, expiry_date)
  2. إنشاء فاتورة مشتريات في `invoices` + `invoice_items` مرتبطة بمورد "مشتريات سريعة"
  3. إنشاء سجل `product_batches`
  4. إنشاء قيد في `treasury` (مصروف مشتريات)
  5. إضافة الصنف تلقائياً إلى سلة التأمين الحالية

**ملاحظة**: لن نضيف قيداً في `ledger` لأن النظام الحالي لا يستخدم ledger للمشتريات — بل يعتمد على حساب الرصيد ديناميكياً من الفواتير. سيظهر الرصيد تلقائياً في حسابات الموردين.

---

## 2. اختيار تاريخ العملية في مبيعات التأمين

**التعديلات:**
- **`InsuranceCustomerDialog.tsx`**: إضافة Date Picker (Popover + Calendar) بتاريخ افتراضي = اليوم. إذا اختار المستخدم تاريخاً أقدم من شهر، يظهر تنبيه تأكيدي.
- **تغيير interface الـ `onConfirm`**: لتقبل `(customer, saleDate)` بدلاً من `(customer)` فقط.
- **`InsurancePOS.tsx`**: تمرير التاريخ المختار إلى `createSale.mutateAsync` ليُحفظ في `sale_date`.
- **`useSupabaseData.ts`**: تعديل `useCreateInsuranceSale` لقبول `sale_date` اختياري وإرساله في الـ insert.

---

## 3. البيع بالتجزئة (بالشريط) في POS

**المنطق:**
- الحقل الموجود: `units_per_package` (عدد الأشرطة في العلبة).
- عند إضافة صنف للسلة في POS، الكمية الافتراضية = 1 شريط (unit).
- كل `CartItem` يحمل `unit_type: 'unit' | 'package'`.

**التعديلات:**
- **`POS.tsx` — `addToCart`**: الإضافة الافتراضية كـ unit (شريط). إذا وصل عدد الأشرطة = `units_per_package`، يتحول تلقائياً لعلبة واحدة. السعر = `sale_price / units_per_package` للشريط.
- **عرض السلة**: يظهر "X علبة و Y شريط" بدلاً من رقم مجرد.
- **`ProductTable.tsx` + صفحة المنتجات**: عرض الكمية كـ "X علبة و Y شريط" باستخدام `units_per_package`.
- **حساب الفاتورة**: سعر الشريط = `sale_price / units_per_package`. سعر العلبة = `sale_price`.
- **خصم المخزون**: الشريط يخصم كسر من العلبة (1 unit من stock).

**ملاحظة مهمة**: المخزون الحالي محسوب بالعلب. الشريط = جزء من علبة. سنخزن المخزون بالوحدات الصغرى (أشرطة) لتسهيل الحساب. هذا يتطلب ترحيل البيانات الحالية: `stock_quantity = stock_quantity * units_per_package`.

**سؤال للمستخدم**: هل تريد تحويل المخزون الحالي ليُحسب بالأشرطة (مثلاً: علبة فيها 3 أشرطة تصبح stock = 3)؟ أم تفضل إبقاء المخزون بالعلب والبيع بالشريط يخصم كسوراً؟

---

## 4. إصلاح الأرقام الطويلة في Dashboard

**التعديل:**
- **`Dashboard.tsx`**: إزالة `truncate` من عناصر الأرقام في البطاقات المالية الستة، واستبدالها بـ `break-all text-wrap` أو تصغير حجم الخط ديناميكياً عند الشاشات الصغيرة (مثلاً `text-sm md:text-2xl`).

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/components/insurance/QuickPurchaseModal.tsx` | ملف جديد |
| `src/pages/InsurancePOS.tsx` | شراء سريع + تمرير التاريخ |
| `src/components/insurance/InsuranceCustomerDialog.tsx` | Date Picker + تمرير التاريخ |
| `src/hooks/useSupabaseData.ts` | sale_date في createInsuranceSale |
| `src/pages/POS.tsx` | بيع بالشريط |
| `src/components/products/ProductTable.tsx` | عرض "X علبة و Y شريط" |
| `src/pages/Dashboard.tsx` | إصلاح wrap الأرقام |

---

## نقطة تحتاج قرارك

بخصوص البيع بالشريط: المخزون الحالي محسوب بالعلب. لتفعيل البيع بالشريط بدقة، هناك خياران:

1. **تحويل المخزون للأشرطة** (migration): كل stock_quantity يُضرب في units_per_package. هذا أنظف رياضياً لكنه يغير كل الأرقام الحالية.
2. **إبقاء المخزون بالعلب**: والشريط يخصم `1/units_per_package` من العلبة (كسور). أبسط لكن قد يسبب أخطاء تقريب.

**التوصية**: الخيار 1 (تحويل للأشرطة) هو الأفضل تقنياً.

