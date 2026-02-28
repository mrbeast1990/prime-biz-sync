

# خطة: تحويل التطبيق إلى PWA قابل للتثبيت

## التغييرات المطلوبة

### 1. تثبيت `vite-plugin-pwa`
- إضافة حزمة `vite-plugin-pwa` كـ dependency

### 2. إعداد `vite.config.ts`
- إضافة `VitePWA` plugin مع manifest كامل (اسم التطبيق، الأيقونات، الألوان، display: standalone)
- إضافة `navigateFallbackDenylist: [/^\/~oauth/]` للـ service worker

### 3. إنشاء أيقونات PWA في `public/`
- `pwa-192x192.png` و `pwa-512x512.png` (أيقونات SVG مولدة برمجياً)

### 4. تحديث `index.html`
- إضافة `<meta name="theme-color">` و `<meta name="apple-mobile-web-app-capable">` و `<link rel="apple-touch-icon">`

### 5. إنشاء صفحة تثبيت `/install`
- مكون بسيط يشرح كيفية تثبيت التطبيق ويعرض زر التثبيت عبر `beforeinstallprompt` event

### الملفات المتأثرة
- `vite.config.ts` - إضافة VitePWA plugin
- `index.html` - meta tags للـ PWA
- `public/pwa-192x192.svg` و `public/pwa-512x512.svg` - أيقونات
- `src/pages/Install.tsx` - صفحة تثبيت (جديد)
- `src/App.tsx` - إضافة route `/install`

