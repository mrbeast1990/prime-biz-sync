import { useState, useEffect } from 'react';
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
import { UserPlus, Shield, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  role?: string;
}

const roleLabels: Record<string, string> = {
  admin: 'مدير',
  manager: 'مشرف',
  user: 'مستخدم',
};

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  user: 'outline',
};

export default function Users() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('user');
  const [addLoading, setAddLoading] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      return (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || 'user',
      })) as UserProfile[];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'تم تغيير الصلاحية بنجاح' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    
    // Sign up the new user
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { display_name: newName } },
    });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      setAddLoading(false);
      return;
    }

    // Assign role if not default
    if (data.user && newRole !== 'user') {
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: newRole as any });
    }

    toast({ title: 'تم إضافة المستخدم بنجاح' });
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    setAddOpen(false);
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewRole('user');
    setAddLoading(false);
  };

  return (
    <MainLayout title="إدارة المستخدمين">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">المستخدمون والصلاحيات</h2>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 ml-2" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>الصلاحية</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="manager">مشرف</SelectItem>
                      <SelectItem value="user">مستخدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={addLoading}>
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">تغيير الصلاحية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name || 'بدون اسم'}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[user.role || 'user']}>
                        {roleLabels[user.role || 'user']}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role || 'user'}
                        onValueChange={(role) => changeRole.mutate({ userId: user.user_id, role })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="manager">مشرف</SelectItem>
                          <SelectItem value="user">مستخدم</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
