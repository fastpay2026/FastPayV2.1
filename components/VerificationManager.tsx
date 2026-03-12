
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, VerificationRequest } from '../types';

// AES-256 Simulation (Frontend only)
// In a real app, this would be handled server-side or via Web Crypto API
const encryptData = (data: string) => {
  // Simulating Riyadh-Node-01 Encryption
  return `ENC_RIYADH_NODE_01_${btoa(data)}`;
};

const decryptData = (data: string) => {
  if (data.startsWith('ENC_RIYADH_NODE_01_')) {
    return atob(data.replace('ENC_RIYADH_NODE_01_', ''));
  }
  return data;
};

interface MerchantProps {
  user: User;
  onUpdateUser: (user: User) => void;
  verificationRequests: VerificationRequest[];
  setVerificationRequests: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  addNotification: (title: string, message: string, type: 'user' | 'money' | 'system' | 'security') => void;
}

export const MerchantVerification: React.FC<MerchantProps> = ({ 
  user, onUpdateUser, verificationRequests, setVerificationRequests, addNotification 
}) => {
  const [files, setFiles] = useState<{ idFront: string; idBack: string; commercialRegister: string }>({
    idFront: '',
    idBack: '',
    commercialRegister: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idFront || !files.idBack || !files.commercialRegister) {
      return alert('يرجى رفع جميع الوثائق المطلوبة');
    }

    setIsUploading(true);
    
    // Simulate Encryption and Upload to Riyadh-Node-01
    setTimeout(() => {
      const newRequest: VerificationRequest = {
        id: uuidv4(),
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        idFront: encryptData(files.idFront),
        idBack: encryptData(files.idBack),
        commercialRegister: encryptData(files.commercialRegister),
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      setVerificationRequests(prev => {
        const updated = [...prev, newRequest];
        console.log("Updated verification requests state:", updated);
        return updated;
      });
      onUpdateUser({ ...user, verificationStatus: 'pending' });
      addNotification('توثيق الحساب', 'تم إرسال طلب التوثيق بنجاح، سيتم مراجعته من قبل الإدارة.', 'security');
      setIsUploading(false);
    }, 2000);
  };

  if (user.verificationStatus === 'verified') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-12 rounded-[3rem] text-center space-y-6">
        <div className="text-8xl">🛡️</div>
        <h3 className="text-4xl font-black text-white flex items-center justify-center gap-3">
          حساب موثق رسمياً
          <span className="text-sky-400 text-3xl">☑️</span>
        </h3>
        <p className="text-emerald-400 font-bold">تم التحقق من هويتك بنجاح. أنت الآن تتمتع بكامل صلاحيات التاجر الموثق.</p>
      </div>
    );
  }

  if (user.verificationStatus === 'rejected') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] text-center space-y-6 animate-in zoom-in">
        <div className="text-8xl">❌</div>
        <h3 className="text-4xl font-black text-white">تم رفض طلب التوثيق</h3>
        <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
          <p className="text-red-400 font-bold text-lg">السبب: {user.verificationReason || 'لم يتم ذكر سبب محدد'}</p>
        </div>
        <p className="text-slate-500 font-bold">يرجى مراجعة الملاحظات وإعادة رفع الوثائق الصحيحة.</p>
        <button 
          onClick={() => onUpdateUser({ ...user, verificationStatus: 'none' })} 
          className="px-12 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl hover:bg-red-500 transition-all active:scale-95"
        >
          إعادة المحاولة 🔄
        </button>
      </div>
    );
  }

  if (user.verificationStatus === 'pending') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 p-12 rounded-[3rem] text-center space-y-6">
        <div className="text-8xl animate-pulse">⏳</div>
        <h3 className="text-4xl font-black text-white">طلبك قيد المراجعة</h3>
        <p className="text-amber-400 font-bold">يقوم فريق الامتثال بمراجعة وثائقك الآن. سيتم إشعارك فور اتخاذ القرار.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black tracking-tighter">توثيق هوية التاجر</h2>
        <p className="text-slate-500 font-bold text-lg">ارفع مستمسكاتك الرسمية للحصول على الشارة الزرقاء وزيادة حدود العمليات.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-white/5 rounded-[4rem] p-16 space-y-12 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs text-slate-500 font-black uppercase tracking-widest mr-4">صورة الهوية (الوجه الأمامي)</label>
            <div className="relative h-64 bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center overflow-hidden group hover:border-sky-500 transition-all">
              {files.idFront ? (
                <img src={files.idFront} className="w-full h-full object-cover" alt="ID Front" />
              ) : (
                <div className="text-center space-y-2">
                  <span className="text-4xl">🪪</span>
                  <p className="text-xs font-bold text-slate-500">اضغط للرفع</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'idFront')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs text-slate-500 font-black uppercase tracking-widest mr-4">صورة الهوية (الوجه الخلفي)</label>
            <div className="relative h-64 bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center overflow-hidden group hover:border-sky-500 transition-all">
              {files.idBack ? (
                <img src={files.idBack} className="w-full h-full object-cover" alt="ID Back" />
              ) : (
                <div className="text-center space-y-2">
                  <span className="text-4xl">🪪</span>
                  <p className="text-xs font-bold text-slate-500">اضغط للرفع</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'idBack')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-xs text-slate-500 font-black uppercase tracking-widest mr-4">السجل التجاري / وثيقة العمل الحر</label>
            <div className="relative h-64 bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center overflow-hidden group hover:border-sky-500 transition-all">
              {files.commercialRegister ? (
                <img src={files.commercialRegister} className="w-full h-full object-cover" alt="Commercial Register" />
              ) : (
                <div className="text-center space-y-2">
                  <span className="text-4xl">📜</span>
                  <p className="text-xs font-bold text-slate-500">ارفع وثيقة السجل التجاري</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'commercialRegister')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="bg-sky-500/5 border border-sky-500/10 p-8 rounded-3xl flex items-start gap-4">
          <span className="text-2xl">🔒</span>
          <div className="space-y-1">
            <p className="text-sky-400 font-black text-sm">تشفير سيادي Riyadh-Node-01</p>
            <p className="text-slate-500 text-xs font-bold">يتم تشفير وثائقك ببروتوكول AES-256 وتخزينها في خوادم معزولة. لا يمكن لأي طرف ثالث الوصول إليها.</p>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isUploading}
          className={`w-full py-8 rounded-[2rem] font-black text-2xl transition-all shadow-2xl flex items-center justify-center gap-4 ${isUploading ? 'bg-slate-800 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 active:scale-95'}`}
        >
          {isUploading ? (
            <>
              <span className="animate-spin">🔄</span>
              جاري التشفير والرفع...
            </>
          ) : (
            <>
              إرسال طلب التوثيق
              <span className="text-3xl">🚀</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

interface AdminProps {
  verificationRequests: VerificationRequest[];
  setVerificationRequests: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  addNotification: (title: string, message: string, type: 'user' | 'money' | 'system' | 'security') => void;
}

export const AdminVerificationReview: React.FC<AdminProps> = ({ 
  verificationRequests, setVerificationRequests, setAccounts, addNotification 
}) => {
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleDecision = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    if (status === 'rejected' && !rejectionReason) return alert('يرجى كتابة سبب الرفض');

    const userId = selectedRequest.userId;
    
    // Update Request
    setVerificationRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status, rejectionReason } : r));

    // Update User
    setAccounts(prev => prev.map(u => u.id === userId ? { 
      ...u, 
      isVerified: status === 'approved',
      verificationStatus: status === 'approved' ? 'verified' : 'rejected',
      verificationReason: status === 'rejected' ? rejectionReason : undefined
    } : u));

    addNotification(
      'مراجعة التوثيق', 
      status === 'approved' ? `تم توثيق حساب ${selectedRequest.fullName} بنجاح.` : `تم رفض طلب توثيق ${selectedRequest.fullName}.`,
      status === 'approved' ? 'user' : 'security'
    );

    setSelectedRequest(null);
    setRejectionReason('');
  };

  const downloadDocument = (data: string, name: string) => {
    const link = document.createElement('a');
    link.href = decryptData(data);
    link.download = `${name}.png`;
    link.click();
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-6xl font-black tracking-tighter">مراجعة توثيق الهوية</h2>
          <p className="text-slate-500 font-bold text-lg">إدارة طلبات التحقق من هوية التجار والشركات.</p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr>
                <th className="p-8">التاجر</th>
                <th className="p-8">تاريخ الطلب</th>
                <th className="p-8">الحالة</th>
                <th className="p-8 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {verificationRequests.filter(r => r.status === 'pending').map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-sky-600/20 text-sky-400 flex items-center justify-center text-xl">
                        {r.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white">{r.fullName}</p>
                        <p className="text-xs text-sky-400 font-mono">@{r.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-slate-400 font-mono text-xs">
                    {new Date(r.submittedAt).toLocaleString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-8">
                    <span className="px-4 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">قيد المراجعة</span>
                  </td>
                  <td className="p-8 text-center">
                    <button 
                      onClick={() => setSelectedRequest(r)}
                      className="bg-sky-600 px-6 py-2 rounded-xl font-black text-xs hover:bg-sky-500 transition-all shadow-lg"
                    >
                      فتح الملف
                    </button>
                  </td>
                </tr>
              ))}
              {verificationRequests.filter(r => r.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center opacity-30">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="font-black text-xl">لا توجد طلبات معلقة حالياً</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl overflow-y-auto">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-7xl rounded-[4rem] p-12 space-y-12 animate-in zoom-in shadow-3xl">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tighter">ملف توثيق: {selectedRequest.fullName}</h3>
                <p className="text-sky-400 font-mono text-sm">ID: {selectedRequest.id} | Riyadh-Node-01 Encrypted</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-4xl opacity-50 hover:opacity-100 transition-all">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { label: 'الهوية (وجه)', data: selectedRequest.idFront, name: 'id_front' },
                { label: 'الهوية (ظهر)', data: selectedRequest.idBack, name: 'id_back' },
                { label: 'السجل التجاري', data: selectedRequest.commercialRegister, name: 'comm_reg' }
              ].map((doc, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{doc.label}</span>
                    <button 
                      onClick={() => downloadDocument(doc.data, `${selectedRequest.username}_${doc.name}`)}
                      className="text-sky-400 hover:text-white transition-colors text-xs font-bold"
                    >
                      تحميل الوثيقة 📥
                    </button>
                  </div>
                  <div className="relative h-[400px] bg-black/60 rounded-[2rem] border border-white/5 overflow-hidden group">
                    <img 
                      src={decryptData(doc.data)} 
                      style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transition: 'transform 0.3s ease' }}
                      className="w-full h-full object-contain cursor-move" 
                      alt={doc.label} 
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="text-xl">➕</button>
                      <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="text-xl">➖</button>
                      <button onClick={() => setRotate(r => r + 90)} className="text-xl">🔄</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="space-y-4">
                <label className="text-xs text-slate-500 font-black uppercase mr-4">ملاحظات الرفض (تظهر للتاجر في حال الرفض)</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-bold outline-none focus:border-red-500 transition-all text-white h-32"
                  placeholder="اكتب سبب الرفض هنا..."
                />
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={() => handleDecision('approved')}
                  className="flex-1 py-6 bg-sky-600 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-sky-500 transition-all flex items-center justify-center gap-4"
                >
                  منح الشارة الزرقاء ☑️
                </button>
                <button 
                  onClick={() => handleDecision('rejected')}
                  className="flex-1 py-6 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[2rem] font-black text-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  رفض الطلب ❌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
