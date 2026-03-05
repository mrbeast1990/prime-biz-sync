

# خطة التعديلات

## 1. حفظ مسودة فاتورة البيع للتأمين (InsurancePOS)
**الملف:** `src/pages/InsurancePOS.tsx`
- إضافة `useEffect` لحفظ `cart` في `sessionStorage` عند مغادرة الصفحة (مثل ما هو موجود في Purchases)
- إضافة `useEffect` لاستعادة المسودة عند فتح الصفحة
- المفتاح: `insurance_pos_draft`

## 2. اقتراح أسماء الأصناف المؤرشفة (كمية صفر) عند الكتابة
**الملف:** `src/pages/Purchases.tsx`
- حالياً `filteredProducts` يشمل كل الأصناف (بما فيها الصفرية). هذا جيد
- المطلوب: عند كتابة اسم في حقل البحث، تظهر الأصناف ذات الكمية الصفرية أيضاً كاقتراحات (وهي تظهر فعلاً لأن فلتر المشتريات لا يستثني الصفرية)

**الملف:** `src/components/products/ProductModal.tsx`
- عند كتابة `trade_name`، إظهار قائمة اقتراحات من الأصناف الموجودة (بما فيها المؤرشفة) تحت حقل الاسم
- جلب الأصناف بـ `supabase.from('products').select('trade_name').ilike('trade_name', '%query%')` أثناء الكتابة
- عند اختيار اقتراح، تعبئة الاسم تلقائياً (وتحذير أن الاسم موجود مسبقاً)

## 3. تنقل بالكيبورد (Enter) في ProductModal حتى زر "إضافة"
**الملف:** `src/components/products/ProductModal.tsx`
- حالياً `batch_number` (ref index 10) يوقف Enter. المطلوب: عند Enter على آخر حقل، يركز على زر "إضافة الصنف" / "حفظ التغييرات"
- إضافة `ref` لزر Submit وربطه بآخر `handleEnterNav`

## 4. تنقل بالكيبورد في المشتريات — التركيز الافتراضي على اسم الصنف
**الملف:** `src/pages/Purchases.tsx`
- عند فتح الصفحة أو بعد إضافة صنف، التركيز التلقائي يكون على حقل البحث عن اسم الصنف
- عند Enter في حقل البحث، إذا كان هناك نتيجة واحدة أضفها مباشرة
- إضافة `ref` لحقل البحث + `useEffect` لتركيزه + `autoFocus`

## 5. القائمة الجانبية مطوية افتراضياً + زر كيبورد للتبديل
**الملفات:** `src/components/layout/Sidebar.tsx`، `src/components/layout/MainLayout.tsx`
- تغيير `useState(false)` إلى `useState(true)` ليكون `collapsed = true` افتراضياً
- إضافة مستمع لوحة مفاتيح: مفتاح `F2` (أو `]`) للتبديل بين ظهور/إخفاء القائمة
- إضافة تنقل بالكيبورد: عندما تكون القائمة مفتوحة، أسهم أعلى/أسفل للتنقل بين العناصر + Enter للدخول
- تحديث `MainLayout` لدعم الحالة المطوية (حالياً `mr-64` ثابت — يجب أن يتغير ديناميكياً)
- لحل هذا: رفع حالة `collapsed` إلى `MainLayout` أو استخدام context/localStorage

### الحل التقني للقائمة:
- إنشاء React Context بسيط `SidebarContext` يحتوي `collapsed` و `toggleSidebar`
- `MainLayout` يوفر الـ Provider
- `Sidebar` يستهلكه
- `useEffect` في `MainLayout` يستمع لـ `F2` ويستدعي `toggleSidebar`
- `mr-64` → `mr-20` عند الطي

## الملفات المتأثرة
1. `src/pages/InsurancePOS.tsx` — حفظ/استعادة مسودة
2. `src/components/products/ProductModal.tsx` — اقتراحات الأسماء + Enter حتى زر الإضافة
3. `src/pages/Purchases.tsx` — تركيز تلقائي على البحث + Enter لإضافة
4. `src/components/layout/Sidebar.tsx` — مطوية افتراضياً + تنقل كيبورد
5. `src/components/layout/MainLayout.tsx` — Context للقائمة + F2 listener + margin ديناميكي

