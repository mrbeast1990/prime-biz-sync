

# خطة التعديلات

## المشاكل المكتشفة والحلول

### 1. إضافة خانة سعر البيع في أصناف المشتريات
**الملف:** `src/pages/Purchases.tsx`
- إضافة حقل `sale_price` إلى `PurchaseItem` interface
- عند إضافة صنف، يتم تعبئة `sale_price` من سعر البيع الحالي للمنتج
- إضافة input "سعر البيع" بجانب "سعر الشراء" في كل صنف بالفاتورة
- تحديث `updateItem` لدعم حقل `sale_price`

### 2. تحديث سعر التكلفة وسعر البيع في بطاقة الصنف عند الشراء
**الملف:** `src/pages/Purchases.tsx` — دالة `handleSave`
- بعد حفظ الفاتورة وتحديث المخزون، يتم تحديث `cost_price` و`sale_price` للمنتج من قيم الفاتورة:
```
await supabase.from('products').update({ cost_price: item.unit_price, sale_price: item.sale_price }).eq('id', item.product_id)
```

### 3. تسجيل قيمة المشتريات في الخزينة
**الملف:** `src/pages/Purchases.tsx` — دالة `handleSave`
- بعد حفظ الفاتورة، إدراج سجل في جدول `treasury`:
```
{ entry_type: 'expense', description: 'فاتورة مشتريات ...', amount: total, category: 'purchases', reference_id: inv.id }
```

### 4. تحديث رصيد المورد في الحسابات
**الملف:** `src/pages/Purchases.tsx` — دالة `handleSave`
- بعد حفظ الفاتورة، تحديث رصيد المورد (إضافة قيمة الفاتورة لأن المشتريات غير مسددة):
```
await supabase.from('contacts').update({ balance: selectedSupplier.balance + total }).eq('id', selectedSupplier.id)
```
- مع إبطال cache الـ contacts

### 5. إضافة حقل "رقم التشغيلة" اختياري في بطاقة الصنف
- **قاعدة البيانات:** إضافة عمود `batch_number text` اختياري لجدول `products`
- **`src/types/index.ts`:** إضافة `batch_number?: string` لـ `Product`
- **`src/components/products/ProductModal.tsx`:** إضافة input "رقم التشغيلة" (اختياري) في النموذج
- **`src/hooks/useSupabaseData.ts`:** إضافة `batch_number` في create/update product

## الملفات المتأثرة
- `src/pages/Purchases.tsx` — سعر البيع + تحديث التكلفة + خزينة + رصيد المورد
- `src/types/index.ts` — إضافة `batch_number`
- `src/components/products/ProductModal.tsx` — حقل رقم التشغيلة
- `src/hooks/useSupabaseData.ts` — إضافة `batch_number` في CRUD
- **Migration:** إضافة عمود `batch_number` لجدول `products`

