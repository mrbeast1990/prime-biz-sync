

# عرض تفاصيل العمليات عند النقر على الصف

## المشكلة الحالية
عند النقر على صف عملية في تفاصيل الحساب، لا يحدث شيء. المستخدم يريد رؤية الأصناف المباعة في كل عملية.

بالنسبة لعملاء التأمين، هناك مشكلة إضافية: جدول `insurance_sales` لا يحتوي على تفاصيل الأصناف (فقط الإجمالي). يجب إنشاء جدول جديد لتخزين أصناف كل عملية تأمين.

## الخطوات

### 1. إنشاء جدول insurance_sale_items في قاعدة البيانات
جدول جديد يخزن تفاصيل أصناف كل عملية تأمين، يحتوي على:
- `id` (uuid)
- `sale_id` (uuid - مرتبط بـ insurance_sales)
- `product_id` (uuid)
- `product_name` (text)
- `quantity` (integer)
- `unit_price` (numeric)
- `total` (numeric)
- `created_at`

مع سياسات أمان مناسبة (قراءة وإدراج للمستخدمين المصادقين).

### 2. تحديث حفظ عمليات بيع التأمين
تعديل `useCreateInsuranceSale` في `useSupabaseData.ts` ليقبل قائمة الأصناف ويحفظها في الجدول الجديد.

تعديل `InsurancePOS.tsx` ليمرر بيانات الأصناف عند إتمام البيع.

### 3. تعديل شاشة تفاصيل الحساب
في `AccountDetailsDialog.tsx`:
- عند النقر على صف عملية، يتوسع الصف (Collapsible) ليعرض جدول الأصناف المباعة
- لعملاء التأمين: يجلب البيانات من `insurance_sale_items`
- للزبائن والموردين: يجلب البيانات من `invoice_items`
- يعرض لكل صنف: الاسم، الكمية، سعر الوحدة، الإجمالي

### التفاصيل التقنية

**الملفات المتأثرة:**

| الملف | التعديل |
|---|---|
| migration SQL | إنشاء جدول `insurance_sale_items` مع RLS |
| `src/hooks/useSupabaseData.ts` | تحديث `useCreateInsuranceSale` لحفظ الأصناف + إضافة hook لجلب أصناف عملية تأمين |
| `src/pages/InsurancePOS.tsx` | تمرير الأصناف عند إتمام البيع |
| `src/components/accounts/AccountDetailsDialog.tsx` | إضافة توسيع الصف لعرض الأصناف + جلب بيانات الأصناف |
| `src/integrations/supabase/types.ts` | سيتحدث تلقائيا بعد إضافة الجدول |

