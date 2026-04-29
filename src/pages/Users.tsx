import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Shield, Loader2, KeyRound } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  role?: string;
  pin_hash?: string | null;
}

const roleLabels: Record<string, string> = { admin: 'مدير', manager: 'مشرف', user: 'مستخدم' };
const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = { admin: 'default', manager: 'secondary', user: 'outline' };

export default function Users() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('user');
  const [addLoading, setAddLoading] = useState(false);

  const [pinDialog, setPinDialog] = useState<{ open: boolean; user?: UserProfile }>({ open: false });
  const [pinValue, setPinValue] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const { data: roles } = await supabase.from('user_roles').select('*');
      return (profiles || []).map((p: any) => ({ ...p, role: roles?.find((r) => r.user_id === p.user_id)?.role || 'user' })) as UserProfile[];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users-with-roles'] }); toast({ title: 'تم تغيير الصلاحية بنجاح' }); },
    onError: (err: any) => { toast({ title: 'خطأ', description: err.message, variant: 'destructive' }); },
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(newPin)) {
      toast({ title: 'PIN يجب أن يكون 6 أرقام', variant: 'destructive' });
      return;
    }
    setAddLoading(true);
    const email = newUsername.includes('@') ? newUsername : `${newUsername}@app.local`;
    const { data, error } = await supabase.auth.signUp({ email, password: newPassword, options: { data: { display_name: newName } } });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); setAddLoading(false); return; }
    if (data.user && newRole !== 'user') {
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: newRole as any });
    }
    // Set PIN immediately
    if (data.user) {
      const { error: pinErr } = await supabase.functions.invoke('set-pin', {
        body: { target_user_id: data.user.id, pin: newPin },
      });
      if (pinErr) {
        toast({ title: 'تم إنشاء المستخدم لكن تعذر حفظ PIN', description: pinErr.message, variant: 'destructive' });
      }
    }
    toast({ title: 'تم إضافة المستخدم بنجاح' });
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    setAddOpen(false); setNewUsername(''); setNewPassword(''); setNewPin(''); setNewName(''); setNewRole('user'); setAddLoading(false);
  };

  const handleSetPin = async () => {
    if (!pinDialog.user || !/^[0-9]{6}$/.test(pinValue)) {
      toast({ title: 'PIN يجب أن يكون 6 أرقام', variant: 'destructive' });
      return;
    }
    setPinLoading(true);
    const { error } = await supabase.functions.invoke('set-pin', {
      body: { target_user_id: pinDialog.user.user_id, pin: pinValue },
    });
    setPinLoading(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تعيين PIN بنجاح' });
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    setPinDialog({ open: false });
    setPinValue('');
  };

  return (
    <MainLayout title="إدارة المستخدمين">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><h2 className="text-lg font-bold">المستخدمون والصلاحيات</h2></div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 ml-2" />إضافة مستخدم</Button></DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة مستخدم جديد</DialogTitle></DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2"><Label>الاسم</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>اسم المستخدم</Label><Input value={newUsername} onChange={e => setNewUsername(e.target.value)} required placeholder="اسم الدخول" /></div>
                <div className="space-y-2"><Label>كلمة المرور (احتياطية)</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} /></div>
                <div className="space-y-2">
                  <Label>الرقم السري PIN (6 أرقام)</Label>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="••••••"
                    className="tabular-nums tracking-widest text-center text-lg"
                  />
                </div>
                <div className="space-y-2"><Label>الصلاحية</Label><Select value={newRole} onValueChange={setNewRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">مدير</SelectItem><SelectItem value="manager">مشرف</SelectItem><SelectItem value="user">مستخدم</SelectItem></SelectContent></Select></div>
                <Button type="submit" className="w-full" disabled={addLoading}>{addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-card-foreground">{user.display_name || 'بدون اسم'}</p>
                    <Badge variant={roleBadgeVariant[user.role || 'user']}>{roleLabels[user.role || 'user']}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-GB')} {user.pin_hash ? '• PIN ✓' : '• بدون PIN'}
                  </p>
                  <div className="mt-3 space-y-2">
                    <Select value={user.role || 'user'} onValueChange={(role) => changeRole.mutate({ userId: user.user_id, role })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">مدير</SelectItem><SelectItem value="manager">مشرف</SelectItem><SelectItem value="user">مستخدم</SelectItem></SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setPinDialog({ open: true, user }); setPinValue(''); }}>
                      <KeyRound className="h-4 w-4 ml-2" />تعيين PIN
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border bg-card">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">PIN</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.display_name || 'بدون اسم'}</TableCell>
                      <TableCell><Badge variant={roleBadgeVariant[user.role || 'user']}>{roleLabels[user.role || 'user']}</Badge></TableCell>
                      <TableCell>
                        {user.pin_hash ? <Badge variant="secondary">معيّن ✓</Badge> : <Badge variant="outline">غير معيّن</Badge>}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select value={user.role || 'user'} onValueChange={(role) => changeRole.mutate({ userId: user.user_id, role })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="admin">مدير</SelectItem><SelectItem value="manager">مشرف</SelectItem><SelectItem value="user">مستخدم</SelectItem></SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => { setPinDialog({ open: true, user }); setPinValue(''); }}>
                            <KeyRound className="h-4 w-4 ml-1" />PIN
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Set PIN dialog */}
      <Dialog open={pinDialog.open} onOpenChange={(o) => setPinDialog({ open: o, user: o ? pinDialog.user : undefined })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين PIN لـ {pinDialog.user?.display_name || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>PIN جديد (6 أرقام)</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="tabular-nums tracking-widest text-center text-xl"
              />
            </div>
            <Button onClick={handleSetPin} disabled={pinLoading || pinValue.length !== 6} className="w-full">
              {pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
