

# حفظ نسخة احتياطية تلقائي عند تسجيل الخروج

## الفكرة
عند الضغط على "تسجيل الخروج"، يتم تلقائياً تحميل ملف JSON يحتوي على كل البيانات (أصناف، فواتير، حسابات، خزينة، تأمين) على جهاز المستخدم قبل تسجيل الخروج.

## التنفيذ

### 1. إنشاء دالة التصدير (`src/utils/backupUtils.ts`)
- دالة `exportBackup()` تجلب البيانات من جداول: `products`, `contacts`, `invoices`, `invoice_items`, `insurance_customers`, `insurance_sales`, `insurance_sale_items`, `treasury`, `product_batches`, `settings`
- تحزمها في ملف JSON مع تاريخ النسخة
- تحمّل الملف تلقائياً باسم `backup_YYYY-MM-DD_HH-mm.json`

### 2. تعديل `handleLogout` في `Header.tsx`
- قبل `signOut`، استدعاء `exportBackup()` مع `toast` يُعلم المستخدم أن النسخة تم حفظها
- عرض `Loader` أثناء التحميل لمنع الضغط المتكرر

## الملفات المتأثرة
1. `src/utils/backupUtils.ts` — ملف جديد
2. `src/components/layout/Header.tsx` — تعديل `handleLogout`

