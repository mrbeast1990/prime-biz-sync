

# خطة: تعديل أحجام الشعارات + إصلاح التنقل على الموبايل + أفكار تطبيق سطح المكتب

## 1. تعديل أحجام الشعارات في PDF (`src/utils/printUtils.ts`)

**السطر 73-74:** تعديل حجم شعار التأمين (PHIF) ليكون أصغر وشعار الصيدلية ليكون أكبر:
- شعار الصيدلية (الترياق الشافي): `height: 180px` (أكبر من 140px)
- شعار التأمين (PHIF): `height: 100px` (أصغر من 140px)

## 2. إصلاح التنقل على الموبايل

المشكلة: الكود يبدو صحيحاً — الـ `Header` يحتوي زر hamburger والـ `Sidebar` يحتوي Sheet. لكن قد تكون المشكلة أن `SheetContent` تحتاج `SheetTitle` لضمان عمل Radix Dialog بشكل صحيح (accessibility requirement يمنع الفتح).

**الحل في `Sidebar.tsx`:**
- إضافة `SheetTitle` و `SheetDescription` (مخفي بـ `sr-only`) داخل `SheetContent` لحل مشكلة Radix accessibility
- إضافة `aria-describedby={undefined}` إذا لزم الأمر

## 3. أفكار تطبيق سطح المكتب

سأقدم للمستخدم خيارين:
1. **PWA (تطبيق ويب تقدمي)** — تثبيت من المتصفح بدون متجر
2. **Electron/Capacitor** — تطبيق أصلي بالكامل

---

**الملفات المتأثرة:**
- `src/utils/printUtils.ts` (أحجام الشعارات)
- `src/components/layout/Sidebar.tsx` (إصلاح Sheet للموبايل)

