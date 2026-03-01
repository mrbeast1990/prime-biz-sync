

# تكبير الشعار في ملفات PDF

## التغيير المطلوب
في `src/utils/printUtils.ts`، السطر الذي يحدد حجم الشعار في دالة `buildPage`:

**الحالي:** `height:60px`

**المطلوب:** تكبير الشعار إلى `120px` مع إضافة `max-width:300px` و `object-fit:contain` لضمان تناسق الشعار مع عرض الصفحة دون تشويه.

### الملف المتأثر
- `src/utils/printUtils.ts` — تعديل سطر واحد في دالة `buildPage`

