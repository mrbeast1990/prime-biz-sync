import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ في تسجيل الدخول', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { display_name: signupName } },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ في إنشاء الحساب', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم إنشاء الحساب بنجاح', description: 'يمكنك الآن تسجيل الدخول' });
      navigate('/');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <ShoppingCart className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">نظام المحاسبة</CardTitle>
          <CardDescription>سجّل دخولك للمتابعة</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="example@mail.com" />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم</Label>
                  <Input value={signupName} onChange={e => setSignupName(e.target.value)} required placeholder="اسم المستخدم" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="example@mail.com" />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} placeholder="6 أحرف على الأقل" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء حساب'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
