

# خطة التعديلات الشاملة

## المشاكل والتعديلات المطلوبة

### 1. تعديل السداد (القيمة، النوع، التاريخ)
- في `AccountDetailsDialog.tsx`: عند الضغط على صف "إيصال سداد"، إضافة زر تعديل يفتح نافذة تعديل تسمح بتغيير المبلغ المسدد وطريقة السداد وتاريخه
- تحديث `handlePayment` لحفظ تاريخ السداد الفعلي (حالياً يُحفظ تاريخ الفاتورة نفسها)

### 2. طباعة إيصال السداد يعرض الرصيد المتبقي
- في `printUtils.ts`: تعديل `printPaymentReceipt` لقبول حقل `remainingBalance` وعرضه في الإيصال المطبوع بعد المبلغ المسدد
- في `AccountDetailsDialog.tsx`: تمرير الرصيد المتبقي عند استدعاء `handlePrintPayment`

### 3. تغيير كل التواريخ من العربية للإنجليزية
جميع استخدامات `toLocaleDateString('ar-SA')` و `toLocaleDateString('ar-EG')` تُستبدل بـ `toLocaleDateString('en-GB')` في:
- `src/pages/Sales.tsx` (سطر 56, 111)
- `src/pages/POS.tsx` (سطر 423, 473)
- `src/pages/Purchases.tsx` (سطر 193, 347)
- `src/pages/Users.tsx` (سطر 193)
- `src/pages/InsuranceCustomers.tsx` (سطر 76)
- `src/components/dashboard/AlertCard.tsx` (سطر 65)

### 4. ترقيم الفواتير بصيغة `T` + رقم تسلسلي عام (بدون تاريخ)
- تعديل `generateInvoiceNumber` في `POS.tsx`: بدلاً من `INV-YYYYMMDD-XXX`، يصبح `T` + رقم تسلسلي عام يعتمد على عدد كل الفواتير في قاعدة البيانات
- تعديل نفس المنطق في `Purchases.tsx` (سطر 110-117): بدلاً من `PUR-YYYYMMDD-XXX`، نفس الصيغة `T` + رقم تسلسلي

### 5. إصلاح رصيد الموردين (يظهر صفر في صفحة الحسابات)
**المشكلة**: صفحة الحسابات تعرض `contact.balance` من الجدول مباشرة، لكن هذا الحقل لا يُحدَّث دائماً بشكل صحيح. بينما في تفاصيل الحساب يُحسب الرصيد من مجموع الفواتير.
**الحل**: في `Accounts.tsx`، حساب الرصيد الفعلي لكل مورد/زبون من الفواتير المرتبطة بدل الاعتماد على حقل `balance` فقط. أي: `الرصيد = مجموع الفواتير - مجموع المسدد`

### 6. تلوين الأرصدة (سالب = أحمر، موجب = أخضر)
- في `Accounts.tsx` و `AccountDetailsDialog.tsx`: إضافة لون أحمر للأرصدة السالبة (علينا) وأخضر للموجبة (لنا)

### 7. تغيير خط أسماء الأصناف والاسم العلمي الإنجليزي
**المشكلة**: `font-sans` المستخدم حالياً في `ProductTable.tsx` يعرض خط غير رسمي للنصوص الإنجليزية
**الحل**: استبدال `font-sans` بخط أنسب. سنضيف فئة CSS مخصصة تستخدم خط `"Segoe UI", "Helvetica Neue", Arial, sans-serif` — أو الأفضل: إزالة `font-sans` والاعتماد على `IBM Plex Sans` المُعرَّف عالمياً في `index.css` كخط أساسي (وهو خط احترافي مناسب للنصوص الإنجليزية)

## الملفات المتأثرة
- `src/components/accounts/AccountDetailsDialog.tsx` — تعديل السداد + إيصال الرصيد المتبقي + تلوين
- `src/utils/printUtils.ts` — إضافة remainingBalance لإيصال السداد
- `src/pages/Sales.tsx` — تواريخ إنجليزية
- `src/pages/POS.tsx` — تواريخ إنجليزية + ترقيم T
- `src/pages/Purchases.tsx` — تواريخ إنجليزية + ترقيم T
- `src/pages/Users.tsx` — تاريخ إنجليزي
- `src/pages/InsuranceCustomers.tsx` — تاريخ إنجليزي
- `src/components/dashboard/AlertCard.tsx` — تاريخ إنجليزي
- `src/pages/Accounts.tsx` — إصلاح الأرصدة + تلوين
- `src/components/products/ProductTable.tsx` — تحسين خط الأصناف الإنجليزية

