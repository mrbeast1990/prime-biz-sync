

# إصلاح الخط: IBM Plex Sans للإنجليزية و Cairo للعربية

## المشكلة
حالياً يوجد تضارب في إعدادات الخط:
- `body` في CSS يضع `Cairo` أولاً → النصوص الإنجليزية (أسماء الأدوية) تظهر بخط Cairo وهو غير مناسب للاتينية
- `tailwind.config.ts` يضع `IBM Plex Sans` أولاً لكن CSS يتجاوزه
- الـ `@font-face` المعرفة (`AppFont`, `LatinFont`, `ArabicFont`) غير مستخدمة فعلياً

## الحل
استخدام `@font-face` مع `unicode-range` لإنشاء خط موحد يفصل تلقائياً بين اللغتين:

### التعديلات

**1. `src/index.css`** - إعادة كتابة قسم الخطوط:
- إزالة الـ `@font-face` غير المستخدمة (`AppFont`, `LatinFont`, `ArabicFont`)
- إنشاء خط موحد `SystemFont` باستخدام `@font-face` مزدوج:
  - أحدهما يشير إلى `IBM Plex Sans` مع `unicode-range` للحروف اللاتينية والأرقام
  - الآخر يشير إلى `Cairo` مع `unicode-range` للحروف العربية
- تعديل `body` ليستخدم `font-family: 'SystemFont', sans-serif`

**2. `tailwind.config.ts`** - تحديث `fontFamily`:
- تغيير `cairo` و `sans` ليستخدما `['SystemFont', 'IBM Plex Sans', 'Cairo', 'sans-serif']`

### النتيجة
- أسماء الأدوية الإنجليزية → IBM Plex Sans (نظيف واحترافي)
- النصوص العربية → Cairo (مصمم للعربية)
- الفصل تلقائي حسب الحرف بدون أي تدخل يدوي

