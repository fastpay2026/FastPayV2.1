
import React, { useState, useEffect } from 'react';
import { User, FXGatewayQueue, FXDistributorStatus, FXFlashRegistry } from '../../types';
import { supabaseService } from '../../supabaseService';
import { useI18n } from '../../i18n/i18n';
import { Shield, Cpu, Upload, CheckCircle, XCircle, Clock, AlertTriangle, Activity, DollarSign, Smartphone, Key } from 'lucide-react';

interface Props {
  user: User;
  addNotification: (title: string, message: string, type: any) => void;
}

const DistributorGatewayManager: React.FC<Props> = ({ user, addNotification }) => {
  const { t } = useI18n();
  const [status, setStatus] = useState<FXDistributorStatus | null>(null);
  const [orders, setOrders] = useState<FXGatewayQueue[]>([]);
  const [keys, setKeys] = useState<FXFlashRegistry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Order Processing State
  const [selectedOrder, setSelectedOrder] = useState<FXGatewayQueue | null>(null);
  const [step, setStep] = useState(1);
  const [hardwareInput, setHardwareInput] = useState('');
  const [txid, setTxid] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statuses, allOrders, allKeys] = await Promise.all([
        supabaseService.getFXDistributorStatuses(),
        supabaseService.getFXGatewayQueue(),
        supabaseService.getFXFlashRegistry()
      ]);
      
      const myStatus = statuses.find(s => s.distributorId === user.id);
      setStatus(myStatus || {
        id: crypto.randomUUID(),
        distributorId: user.id,
        status: 'offline',
        usdtCapacity: 0,
        lastActive: new Date().toISOString()
      });
      
      setOrders(allOrders.filter(o => o.distributorId === user.id));
      setKeys(allKeys.filter(k => k.distributorId === user.id && k.status === 'active'));
    } catch (error) {
      console.error("Error fetching distributor gateway data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'online' | 'offline' | 'delayed', capacity?: number) => {
    if (!status) return;
    try {
      const updated = { 
        ...status, 
        status: newStatus, 
        usdtCapacity: capacity !== undefined ? capacity : status.usdtCapacity,
        lastActive: new Date().toISOString()
      };
      await supabaseService.upsertFXDistributorStatus(updated);
      setStatus(updated);
      addNotification('Status Updated', `Your gateway status is now ${newStatus}`, 'security');
    } catch (error) {
      alert("Error updating status");
    }
  };

  const handleHandshake = async () => {
    if (!selectedOrder) return;
    
    const matchingKey = keys.find(k => k.hardwareHash === hardwareInput);
    if (!matchingKey) {
      alert("Invalid Hardware Signature. Handshake Failed.");
      return;
    }

    setStep(3);
    addNotification('Handshake Success', 'Hardware signature verified. Proceed to proof upload.', 'security');
  };

  const handleSubmitProof = async () => {
    if (!selectedOrder || !txid || !receiptUrl) {
      alert("Please enter TXID and Receipt URL");
      return;
    }

    setIsProcessing(true);
    try {
      const updatedOrder: FXGatewayQueue = {
        ...selectedOrder,
        status: 'success_pending_review',
        txid,
        receiptUrl,
        updatedAt: new Date().toISOString()
      };
      await supabaseService.upsertFXGatewayQueue(updatedOrder);
      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(null);
      setStep(1);
      setTxid('');
      setReceiptUrl('');
      setHardwareInput('');
      addNotification('Proof Submitted', 'Transfer proof submitted for admin review.', 'money');
    } catch (error) {
      alert("Error submitting proof");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Activity className="animate-spin text-sky-500" /></div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4" dir="rtl">
      {/* Status & Liquidity Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${status?.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <Activity size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter">حالة بوابة USDT</h2>
              <p className="text-slate-500 font-bold">تحكم في ظهورك في نظام التوجيه الذكي</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {(['online', 'offline', 'delayed'] as const).map(s => (
              <button 
                key={s}
                onClick={() => handleUpdateStatus(s)}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                  status?.status === s 
                    ? 'bg-sky-600 border-sky-400 text-white shadow-xl shadow-sky-900/20' 
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                }`}
              >
                {s === 'online' ? 'متصل' : s === 'offline' ? 'غير متصل' : 'متأخر'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">السيولة المتوفرة (USDT)</h3>
            <DollarSign className="text-emerald-400" size={20} />
          </div>
          <div className="flex gap-4">
            <input 
              type="number"
              value={status?.usdtCapacity}
              onChange={(e) => handleUpdateStatus(status?.status || 'offline', parseFloat(e.target.value))}
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-2xl text-emerald-400 outline-none focus:border-emerald-500 transition-all"
            />
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center">
              <span className="font-black">USDT</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold text-center">سيتم توجيه الطلبات إليك بناءً على هذا الرصيد</p>
        </div>
      </div>

      {/* Main Content: Orders & Processing */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Orders Queue */}
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Clock className="text-sky-400" size={20} />
                طلبات التحويل الواردة
              </h3>
              <span className="px-4 py-1 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {orders.filter(o => o.status === 'pending_distributor').length} طلبات معلقة
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-black/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-6">المبلغ الإجمالي</th>
                    <th className="p-6">الصافي للمستلم</th>
                    <th className="p-6">الحالة</th>
                    <th className="p-6">التوقيت</th>
                    <th className="p-6">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <p className="font-black text-lg">${order.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold">شامل الرسوم</p>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-emerald-400 text-lg">${order.netAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold">USDT</p>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          order.status === 'success_pending_review' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-sky-500/10 text-sky-500'
                        }`}>
                          {order.status === 'pending_distributor' ? 'بانتظارك' : 
                           order.status === 'success_pending_review' ? 'قيد المراجعة' : 'مكتمل'}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-slate-500 font-bold">
                        {new Date(order.createdAt).toLocaleString('ar-SA')}
                      </td>
                      <td className="p-6">
                        {order.status === 'pending_distributor' && (
                          <button 
                            onClick={() => { setSelectedOrder(order); setStep(1); }}
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-xs transition-all"
                          >
                            معالجة الطلب
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-600 font-bold">لا توجد طلبات حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Processing Panel */}
        <div className="space-y-8">
          {selectedOrder ? (
            <div className="glass-card p-10 rounded-[3rem] border border-sky-500/30 bg-sky-500/5 space-y-8 animate-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">معالجة الطلب الآمن</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
                {[1, 2, 3].map(s => (
                  <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10 border-2 transition-all ${
                    step >= s ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-white/10 text-slate-500'
                  }`}>
                    {s}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">تفاصيل التحويل المطلوبة</h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-3xl font-black text-white">${selectedOrder.netAmount.toLocaleString()}</p>
                        <p className="text-xs font-bold text-sky-400">USDT (TRC-20)</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase">عنوان المحفظة</p>
                        <p className="text-xs font-mono font-bold text-white">TXXXX...XXXX</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl transition-all"
                  >
                    بدء المصافحة Hardware Handshake
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto text-sky-400">
                      <Smartphone size={40} className="animate-pulse" />
                    </div>
                    <h4 className="font-black text-lg">تأكيد مفتاح Flash Key</h4>
                    <p className="text-sm text-slate-400 font-bold">يرجى إدخال توقيع الجهاز الفعلي المبرمج مسبقاً</p>
                  </div>
                  <input 
                    type="password"
                    value={hardwareInput}
                    onChange={(e) => setHardwareInput(e.target.value)}
                    placeholder="أدخل توقيع الجهاز..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 font-mono text-center text-sky-400 outline-none focus:border-sky-500"
                  />
                  <button 
                    onClick={handleHandshake}
                    className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <Shield size={20} />
                    تأكيد المصافحة
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">رقم العملية (TXID)</label>
                    <input 
                      type="text"
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      placeholder="أدخل TXID هنا..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">رابط إيصال التحويل (Screenshot URL)</label>
                    <input 
                      type="text"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <button 
                    onClick={handleSubmitProof}
                    disabled={isProcessing}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Activity className="animate-spin" /> : <Upload size={20} />}
                    إرسال إثبات التحويل للمراجعة
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-700">
                <Shield size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-500">بانتظار طلبات جديدة</h3>
              <p className="text-sm text-slate-600 font-bold max-w-xs">عند وصول طلب تحويل USDT متوافق مع سيولتك، سيظهر هنا للمعالجة الفورية.</p>
            </div>
          )}

          {/* Active Keys Info */}
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Key size={16} />
              مفاتيح Flash المصرح بها
            </h3>
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                      <CheckCircle size={16} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {k.hardwareHash.substring(0, 10)}...
                    </span>
                  </div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">نشط</span>
                </div>
              ))}
              {keys.length === 0 && <p className="text-center text-[10px] text-slate-600 font-bold py-4">لا توجد مفاتيح مبرمجة. تواصل مع الإدارة.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorGatewayManager;
