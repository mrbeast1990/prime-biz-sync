

# إصلاح خطأ عملية الاسترجاع والإتلاف

## المشكلة
جدول `invoices` يحتوي على قيد (`CHECK constraint`) يسمح فقط بنوعين للفاتورة:
- `sale`
- `purchase`

بينما الكود يحاول إدخال أنواع إضافية مثل `return` (استرجاع) و `damage` (إتلاف)، مما يسبب رفض العملية من قاعدة البيانات.

## الحل
تعديل القيد في قاعدة البيانات ليقبل جميع الأنواع المستخدمة في التطبيق.

### التعديل المطلوب

**1. تعديل قاعدة البيانات (Migration)**

تحديث القيد `invoices_invoice_type_check` ليقبل القيم التالية:
- `sale` (بيع)
- `purchase` (شراء)
- `return` (استرجاع)
- `damage` (إتلاف)

```text
ALTER TABLE public.invoices DROP CONSTRAINT invoices_invoice_type_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_type_check 
  CHECK (invoice_type = ANY (ARRAY['sale', 'purchase', 'return', 'damage']));
```

لا حاجة لتعديل أي ملفات كود -- المشكلة فقط في قاعدة البيانات.
