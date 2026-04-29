import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2, User as UserIcon, Delete, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DirEntry {
  user_id: string;
  display_name: string | null;
  has_pin: boolean;
}

const PIN_LENGTH = 6;

async function derivePassword(userId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`pharma-pin-v1:${userId}:${pin}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function Auth() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DirEntry[]>([]);
  const [selected, setSelected] = useState<DirEntry | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('user_directory' as any)
        .select('*')
        .order('display_name', { ascending: true });
      if (!error && data) setUsers(data as any);
      setLoadingList(false);
    })();
  }, []);

  const handleDigit = (d: string) => {
    if (pin.length >= PIN_LENGTH || loading) return;
    setPin((p) => p + d);
  };
  const handleBackspace = () => setPin((p) => p.slice(0, -1));
  const handleClear = () => setPin('');

  // Auto-submit when PIN reaches full length
  useEffect(() => {
    if (selected && pin.length === PIN_LENGTH && !loading) {
      void handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const password = await derivePassword(selected.user_id, pin);
      // Lookup email from profiles via auth signin: we stored email = username@app.local.
      // We can't query auth.users from client, so fetch via RPC: use display_name? we need email.
      // Workaround: profiles doesn't store email. We rely on the convention that email is stored
      // in auth.users; signInWithPassword needs email. So we fetch via an RPC.
      const { data: emailData, error: emailErr } = await supabase
        .rpc('get_user_email' as any, { _user_id: selected.user_id });
      if (emailErr || !emailData) {
        toast({ title: 'خطأ', description: 'تعذر العثور على المستخدم', variant: 'destructive' });
        setPin('');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailData as string,
        password,
      });
      if (error) {
        toast({ title: 'PIN غير صحيح', variant: 'destructive' });
        setPin('');
        setLoading(false);
      } else {
        navigate('/');
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
      setPin('');
      setLoading(false);
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <ShoppingCart className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">نظام المحاسبة</CardTitle>
          <CardDescription>
            {selected ? `أدخل الرقم السري لـ ${selected.display_name || 'المستخدم'}` : 'اختر اسم المستخدم'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {loadingList ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">لا يوجد مستخدمون</p>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => u.has_pin && setSelected(u)}
                      disabled={!u.has_pin}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg border bg-card p-3 text-right transition-colors',
                        u.has_pin
                          ? 'hover:bg-accent hover:border-primary cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{u.display_name || 'بدون اسم'}</p>
                        {!u.has_pin && (
                          <p className="text-xs text-muted-foreground">لم يتم تعيين PIN</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="w-full"
                onClick={() => navigate('/auth?mode=password')}
              >
                دخول بكلمة المرور (للمدير)
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PIN dots */}
              <div className="flex justify-center gap-3">
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition-all',
                      i < pin.length
                        ? 'bg-primary border-primary scale-110'
                        : 'border-muted-foreground/40'
                    )}
                  />
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-3">
                {digits.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="outline"
                    onClick={() => handleDigit(d)}
                    disabled={loading}
                    className="h-16 text-2xl font-bold tabular-nums"
                  >
                    {d}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClear}
                  disabled={loading || !pin}
                  className="h-16 text-sm"
                >
                  مسح
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDigit('0')}
                  disabled={loading}
                  className="h-16 text-2xl font-bold tabular-nums"
                >
                  0
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackspace}
                  disabled={loading || !pin}
                  className="h-16"
                >
                  <Delete className="h-5 w-5" />
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSelected(null);
                  setPin('');
                }}
                disabled={loading}
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                تغيير المستخدم
              </Button>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
