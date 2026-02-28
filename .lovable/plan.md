

# خطة التعديلات المطلوبة

## المطلوب (4 محاور رئيسية)

### 1. كشف حساب مورد (مدين/دائن) + تعديل/إلغاء السداد
**في `AccountDetailsDialog.tsx`:**
- إضافة زر "طباعة كشف حساب" يطبع تقرير مدين/دائن (المشتريات = مدين، السدادات = دائن)
- في جدول الحركات: إضافة عمود "مدين/دائن" وعمود "نوع العملية" (فاتورة / إيصال سداد)
- إضافة خيار تعديل أو إلغاء إيصال السداد (إرجاع المبلغ المسدد من الفاتورة)

**في `printUtils.ts`:**
- إضافة دالة `printAccountStatement` لطباعة كشف حساب احترافي بنمط مدين/دائن مع الرصيد التراكمي

### 2. إعدادات الصيدلية: شعار + نماذج فواتير
**في `Settings.tsx`:**
- إضافة خانة رفع شعار (upload to storage bucket `product-images` أو bucket جديد)
- حفظ URL الشعار في جدول `settings` بمفتاح `pharmacy_logo`
- إضافة قسم "نماذج الفواتير" مع 2-3 نماذج مختلفة (كلاسيكي، حديث، بسيط) يتم حفظ الاختيار في `settings`

**في `useSettings.ts` و `PharmacySettings` type:**
- إضافة حقل `logo` وحقل `invoiceTemplate` للنوع

**في `printUtils.ts`:**
- تعديل `buildPage` لعرض الشعار في الـ header
- إضافة دعم نماذج الفواتير المختلفة

**Storage bucket:** إنشاء bucket `pharmacy-assets` أو استخدام `product-images` الموجود

### 3. بطاقة الصنف: الحد الأدنى + طباعة بدل تصدير
**في `ProductModal.tsx`:**
- تغيير القيمة الافتراضية لـ `min_stock` من 10 إلى 0

**في `Products.tsx`:**
- تغيير زر "تصدير" إلى "طباعة" مع dropdown (PDF / Excel)
- عند الطباعة PDF: طباعة جدول كامل بكل بيانات المنتجات بشكل متناسق
- عند Excel: نفس `exportProductsToCSV` الموجود

### 4. تحويل الأرقام والتواريخ إلى إنجليزية
**في `AccountDetailsDialog.tsx` و `Treasury.tsx` وأي مكان يستخدم `toLocaleDateString('ar-SA')`:**
- تغيير التنسيق لاستخدام أرقام إنجليزية: `toLocaleDateString('en-GB')` أو تنسيق مخصص
- التأكد من أن جميع الأرقام المالية تظهر بأرقام إنجليزية (0-9) بدل العربية

## الملفات المتأثرة
- `src/types/index.ts` - إضافة `logo` و `invoiceTemplate` لـ PharmacySettings
- `src/hooks/useSettings.ts` - جلب الحقول الجديدة
- `src/pages/Settings.tsx` - رفع شعار + نماذج فواتير + حفظ فعلي في DB
- `src/utils/printUtils.ts` - شعار في header + كشف حساب + نماذج
- `src/components/accounts/AccountDetailsDialog.tsx` - مدين/دائن + كشف حساب + تعديل سداد + أرقام إنجليزية
- `src/pages/Treasury.tsx` - أرقام إنجليزية
- `src/components/products/ProductModal.tsx` - min_stock = 0
- `src/pages/Products.tsx` - زر طباعة بدل تصدير
- `src/utils/exportUtils.ts` - دالة طباعة PDF للمنتجات

