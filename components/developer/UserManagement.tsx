
import React, { useState } from 'react';
import { User, Role } from '../../types';

interface Props {
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserManagement: React.FC<Props> = ({ accounts, setAccounts }) => {
  const [userSearch, setUserSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ fullName: '', username: '', password: '', role: 'USER' as Role, balance: 0 });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: userForm.username.trim(),
      fullName: userForm.fullName,
      password: userForm.password || 'FastPay123', // Default temporary password if empty
      role: userForm.role,
      balance: userForm.balance,
      status: 'active',
      email: `${userForm.username}@fastpay.com`,
      createdAt: new Date().toLocaleDateString()
    };
    setAccounts(prev => [...prev, newUser]);
    setIsModalOpen(false);
    setUserForm({ fullName: '', username: '', password: '', role: 'USER', balance: 0 });
    alert(`تمت إضافة ${newUser.role} بنجاح ✅\nكلمة المرور المؤقتة: ${newUser.password}`);
  };

  const adjustBalance = (id: string) => {
    const amt = prompt('أدخل المبلغ (موجب للإضافة، سالب للخصم):', '0');
    if (amt) {
      const p = parseFloat(amt);
      if (!isNaN(p)) setAccounts(prev => prev.map(u => u.id === id ? { ...u, balance: u.balance + p } : u));
    }
  };

  const zeroBalance = (id: string) => {
    if (confirm('هل أنت متأكد من تصفير رصيد هذا الحساب؟')) {
      setAccounts(prev => prev.map(u => u.id === id ? { ...u, balance: 0 } : u));
    }
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'تفعيل' : 'تعليق';
    if (confirm(`هل تريد ${action} هذا الحساب؟`)) {
      setAccounts(prev => prev.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPassword) return;
    setAccounts(prev => prev.map(u => u.id === editingUser.id ? { ...u, password: newPassword } : u));
    alert('تم تغيير كلمة المرور بنجاح ✅');
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setEditingUser(null);
  };

  const filteredUsers = accounts.filter(u => u.username.includes(userSearch) || u.fullName.includes(userSearch));

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-black tracking-tighter">إدارة حسابات النخبة</h2>
        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all">+ إضافة عضو</button>
          <input type="text" placeholder="بحث..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10 w-80 outline-none" />
        </div>
      </div>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr>
                <th className="p-8">العضو</th>
                <th className="p-8">الرصيد</th>
                <th className="p-8">الرتبة</th>
                <th className="p-8">الحالة</th>
                <th className="p-8 text-center">التحكم المتقدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${u.status === 'active' ? 'bg-sky-600/20 text-sky-400' : 'bg-red-600/20 text-red-400'}`}>
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white">{u.fullName}</p>
                        <p className="text-xs text-sky-400 font-mono">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-emerald-400 font-mono text-xl">${u.balance.toLocaleString()}</td>
                  <td className="p-8 text-xs text-slate-500 font-black uppercase tracking-widest">{u.role}</td>
                  <td className="p-8">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.status === 'active' ? 'نشط' : 'معلق'}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex justify-center gap-2 flex-wrap max-w-[400px]">
                      <button onClick={() => adjustBalance(u.id)} className="bg-sky-600/20 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-sky-600 hover:text-white transition-all">شحن</button>
                      <button onClick={() => zeroBalance(u.id)} className="bg-amber-600/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all">تصفير</button>
                      <button onClick={() => toggleStatus(u.id, u.status)} className={`${u.status === 'active' ? 'bg-red-600/20 text-red-400 border-red-500/20' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20'} px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:opacity-80 transition-all`}>
                        {u.status === 'active' ? 'تعليق' : 'تفعيل'}
                      </button>
                      <button onClick={() => { setEditingUser(u); setIsPasswordModalOpen(true); }} className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">كلمة المرور</button>
                      <button onClick={() => { if (confirm('حذف الحساب نهائياً؟')) setAccounts(p => p.filter(x => x.id !== u.id)) }} className="bg-red-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-red-500 transition-all">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleSaveUser} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-4xl font-black mb-8 tracking-tighter">إضافة عضو جديد للنظام</h3>
            <div className="space-y-4">
              <input required value={userForm.fullName} onChange={e => setUserForm({ ...userForm, fullName: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all text-white" placeholder="الاسم الثلاثي الكامل" />
              <input required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all font-mono text-white" placeholder="اسم المستخدم" />
              <div className="space-y-1 text-right">
                <label className="text-[10px] text-slate-500 mr-6 font-black uppercase">كلمة مرور مؤقتة (اختياري)</label>
                <input type="text" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all text-white font-mono" placeholder="FastPay123" />
              </div>
            </div>
            <div className="space-y-3 text-right">
              <label className="text-xs text-slate-500 mr-6 font-black uppercase tracking-widest">تحديد رتبة العضو</label>
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as Role })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-sky-400 outline-none cursor-pointer">
                <option value="USER">مستخدم (User)</option>
                <option value="DISTRIBUTOR">موزع معتمد (Distributor)</option>
                <option value="MERCHANT">تاجر - Merchant Suite</option>
                <option value="ACCOUNTANT">محاسب نظام (Accountant)</option>
                <option value="DEVELOPER">مدير تنفيذي (Admin)</option>
              </select>
            </div>
            <div className="space-y-2 text-right">
              <label className="text-xs text-slate-500 mr-6 font-black uppercase">الرصيد الافتتاحي ($)</label>
              <input type="number" required value={userForm.balance} onChange={e => setUserForm({ ...userForm, balance: parseFloat(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 outline-none text-2xl text-center" />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl hover:bg-sky-500 transition-all">حفظ الحساب</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-xl hover:bg-white/10 transition-all">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && editingUser && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleChangePassword} className="bg-[#111827] border border-white/10 w-full max-w-md rounded-[3rem] p-12 space-y-8 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-3xl font-black tracking-tighter">تغيير كلمة المرور</h3>
            <p className="text-slate-500 font-bold">للعضو: {editingUser.fullName}</p>
            <div className="space-y-4">
              <input 
                required 
                type="text" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all text-white font-mono text-center text-2xl" 
                placeholder="كلمة المرور الجديدة" 
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-500 transition-all">تحديث</button>
              <button type="button" onClick={() => { setIsPasswordModalOpen(false); setEditingUser(null); }} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
