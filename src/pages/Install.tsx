import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Monitor, Smartphone, CheckCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <MainLayout title="تثبيت التطبيق">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">تثبيت التطبيق</h1>

        {isInstalled ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <CheckCircle className="h-16 w-16 text-primary" />
              <p className="text-lg font-semibold">التطبيق مثبت بالفعل!</p>
              <p className="text-muted-foreground">يمكنك فتحه من سطح المكتب أو الشاشة الرئيسية.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferredPrompt && (
              <Card className="border-primary">
                <CardContent className="flex flex-col items-center gap-4 py-8">
                  <Download className="h-12 w-12 text-primary" />
                  <p className="text-lg font-semibold">التطبيق جاهز للتثبيت</p>
                  <Button size="lg" onClick={handleInstall}>
                    <Download className="ml-2 h-5 w-5" />
                    تثبيت التطبيق الآن
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  التثبيت على الكمبيوتر
                </CardTitle>
                <CardDescription>Chrome / Edge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. افتح التطبيق في المتصفح</p>
                <p>2. اضغط على أيقونة التثبيت في شريط العنوان (أو من القائمة ⋮)</p>
                <p>3. اضغط "تثبيت"</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  التثبيت على الهاتف
                </CardTitle>
                <CardDescription>Android / iOS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Android:</strong> افتح في Chrome → القائمة ⋮ → "إضافة إلى الشاشة الرئيسية"</p>
                <p><strong>iOS:</strong> افتح في Safari → زر المشاركة ↑ → "إضافة إلى الشاشة الرئيسية"</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Install;
