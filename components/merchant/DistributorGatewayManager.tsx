import React, { useState, useEffect } from 'react';
import { User, FXGatewayQueue, FXDistributorStatus, SecurityKey, SecurityConfig } from '../../types';
import { supabaseService } from '../../supabaseService';
import { useI18n } from '../../i18n/i18n';
import { 
  Shield, 
  Cpu, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Activity, 
  DollarSign, 
  Smartphone, 
  Key,
  Usb,
  Lock,
  Unlock,
  RefreshCw,
  ArrowRight,
  Wallet,
  Zap,
  AlertCircle,
  Image as ImageIcon,
  Check,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: User;
  addNotification: (title: string, message: string, type: any) => void;
}

const DistributorGatewayManager: React.FC<Props> = ({ user, addNotification }) => {
  const { t } = useI18n();
  const [status, setStatus] = useState<FXDistributorStatus | null>(null);
  const [orders, setOrders] = useState<FXGatewayQueue[]>([]);
  const [keys, setKeys] = useState<SecurityKey[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  
  // Security Key State
  const [isKeyVerified, setIsKeyVerified] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // Order Processing State
  const [selectedOrder, setSelectedOrder] = useState<FXGatewayQueue | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    checkUsbKey();

    // Listen for USB events
    const handleUsbConnect = () => checkUsbKey();
    const handleUsbDisconnect = () => checkUsbKey();

    // @ts-ignore
    if ((navigator as any).usb) {
      (navigator as any).usb.addEventListener('connect', handleUsbConnect);
      (navigator as any).usb.addEventListener('disconnect', handleUsbDisconnect);
    }

    return () => {
      // @ts-ignore
      if ((navigator as any).usb) {
        (navigator as any).usb.removeEventListener('connect', handleUsbConnect);
        (navigator as any).usb.removeEventListener('disconnect', handleUsbDisconnect);
      }
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statuses, allOrders, allKeys, allConfigs] = await Promise.all([
        supabaseService.getFXDistributorStatuses(),
        supabaseService.getFXGatewayQueue(),
        supabaseService.getDistributorSecurityKeys(),
        supabaseService.getDistributorSecurityConfigs()
      ]);
      
      const myStatus = statuses.find(s => s.distributor_id === user.id);
      setStatus(myStatus || {
        distributor_id: user.id,
        availability_status: 'offline',
        usdt_capacity: 0,
        updated_at: new Date().toISOString()
      });
      
      setOrders(allOrders.filter(o => o.distributor_id === user.id));
      setKeys(allKeys.filter(k => k.distributor_id === user.id && k.status === 'active'));
      setSecurityConfig(allConfigs.find(c => c.distributor_id === user.id) || null);
    } catch (error) {
      console.error("Error fetching distributor gateway data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = async () => {
    // @ts-ignore
    if (!(navigator as any).usb) return;
    setIsCheckingKey(true);
    try {
      // @ts-ignore
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const matchingKey = keys.find(k => 
        device.vendorId === k.vendor_id && 
        device.productId === k.product_id && 
        device.serialNumber === k.serial_number
      );

      if (matchingKey) {
        setIsKeyVerified(true);
        setConnectedDevice(device);
        addNotification('Key Verified', 'Security key verified successfully.', 'security');
      } else {
        setIsKeyVerified(false);
        setConnectedDevice(null);
        addNotification('Verification Failed', 'This USB key is not registered for your account.', 'error');
      }
    } catch (error) {
      console.error("Manual USB Verify Error:", error);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const checkUsbKey = async () => {
    // @ts-ignore
    if (!(navigator as any).usb) return;
    
    setIsCheckingKey(true);
    try {
      // @ts-ignore
      const devices = await (navigator as any).usb.getDevices();
      
      if (devices.length === 0) {
        setIsKeyVerified(false);
        setConnectedDevice(null);
        return;
      }

      // Find a matching key in our registry
      const matchingKey = keys.find(k => 
        devices.some((d: any) => 
          d.vendorId === k.vendor_id && 
          d.productId === k.product_id && 
          d.serialNumber === k.serial_number
        )
      );

      if (matchingKey) {
        setIsKeyVerified(true);
        const device = devices.find((d: any) => 
          d.vendorId === matchingKey.vendor_id && 
          d.productId === matchingKey.product_id && 
          d.serialNumber === matchingKey.serial_number
        );
        setConnectedDevice(device || null);
      } else {
        setIsKeyVerified(false);
        setConnectedDevice(null);
      }
    } catch (error) {
      console.error("USB Check Error:", error);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handlePinVerify = async () => {
    if (!pinInput || pinInput.length < 4) {
      addNotification('Invalid Input', 'Please enter a valid security PIN.', 'error');
      return;
    }

    setIsVerifyingPin(true);
    try {
      const isValid = await supabaseService.verifyDistributorPIN(pinInput);

      if (isValid) {
        setIsPinVerified(true);
        addNotification('PIN Verified', 'Security PIN fallback authorized. You can now process transfers.', 'security');
        setShowPinInput(false);
      } else {
        addNotification('Invalid PIN', 'The security PIN you entered is incorrect.', 'error');
        setPinInput('');
      }
    } catch (error: any) {
      console.error("PIN Verification Error:", error);
      addNotification('Error', error.message || 'An error occurred during PIN verification.', 'error');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'online' | 'offline' | 'delayed', capacity?: number) => {
    setIsUpdatingStatus(true);
    try {
      const currentStatus = status || {
        distributor_id: user.id,
        availability_status: 'offline',
        usdt_capacity: 0,
        updated_at: new Date().toISOString()
      };

      const updated: FXDistributorStatus = { 
        ...currentStatus, 
        availability_status: newStatus, 
        usdt_capacity: capacity !== undefined ? capacity : currentStatus.usdt_capacity,
        updated_at: new Date().toISOString()
      };
      
      await supabaseService.upsertFXDistributorStatus(updated);
      setStatus(updated);
      addNotification(t('status_updated') || 'Status Updated', `${t('gateway_status_is')} ${newStatus}`, 'security');
    } catch (error) {
      console.error("Status Update Error:", error);
      addNotification('Error', 'Failed to update gateway status. Please try again.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setOcrStatus('idle');
      setOcrError(null);
    }
  };

  const validateReceipt = async (file: File, order: FXGatewayQueue): Promise<boolean> => {
    setOcrStatus('processing');
    // Simulate OCR Processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock Validation Logic
    if (!file.type.startsWith('image/')) {
      setOcrError("Invalid file type. Please upload a clear image of the transfer receipt.");
      return false;
    }

    // Simulate date check (Today)
    // In a real app, we'd extract text from the image here
    
    setOcrStatus('success');
    return true;
  };

  const handleProcessOrder = async () => {
    if (!selectedOrder || !receiptFile || (!isKeyVerified && !isPinVerified)) return;

    setIsProcessing(true);
    try {
      const isValid = await validateReceipt(receiptFile, selectedOrder);
      
      if (!isValid) {
        setOcrStatus('error');
        setIsProcessing(false);
        return;
      }

      const updatedOrder: FXGatewayQueue = {
        ...selectedOrder,
        status: 'success_pending_review',
        receipt_image: 'mock_receipt_url_' + Date.now(), // In real app, upload to Supabase Storage
        tx_id: 'TX' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        updated_at: new Date().toISOString()
      };

      await supabaseService.upsertFXGatewayQueue(updatedOrder);
      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      addNotification('Order Processed', 'Transfer proof submitted for review.', 'money');
    } catch (error) {
      alert("Error processing transfer");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Activity className="animate-spin text-sky-500" /></div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
      {/* Security Status Banner */}
      <div className={`p-6 rounded-[2rem] border flex flex-col gap-6 transition-all ${
        (isKeyVerified || isPinVerified)
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${(isKeyVerified || isPinVerified) ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {(isKeyVerified || isPinVerified) ? <Lock size={24} /> : <Unlock size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {(isKeyVerified || isPinVerified) ? t('security_authorized') : t('security_auth_required')}
              </h3>
              <p className="text-xs font-bold opacity-70">
                {isKeyVerified 
                  ? t('usb_key_connected').replace('${name}', connectedDevice?.productName || 'Authorized Device')
                  : isPinVerified 
                    ? t('pin_fallback_authorized')
                    : t('connect_usb_or_pin')}
              </p>
            </div>
          </div>
          {isCheckingKey && <RefreshCw className="animate-spin" size={20} />}
          <div className="flex gap-3">
            {!isKeyVerified && !isPinVerified && (
              <button 
                onClick={() => setShowPinInput(!showPinInput)} 
                className="px-6 py-2 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
              >
                <Smartphone size={14} />
                {showPinInput ? t('cancel_pin') : t('use_pin_fallback')}
              </button>
            )}
            <button 
              onClick={handleManualVerify} 
              className="px-6 py-2 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
            >
              {t('manual_usb_verify')}
            </button>
            {!(isKeyVerified || isPinVerified) && !isCheckingKey && (
              <button onClick={checkUsbKey} className="px-6 py-2 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all">
                {t('retry_detection')}
              </button>
            )}
          </div>
        </div>

        {/* PIN Input Section */}
        <AnimatePresence>
          {showPinInput && !isKeyVerified && !isPinVerified && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder={t('enter_6_digit_pin')}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-center text-2xl tracking-[1em] text-sky-400 outline-none focus:border-sky-500"
                  />
                </div>
                <button 
                  onClick={handlePinVerify}
                  disabled={isVerifyingPin || pinInput.length < 4}
                  className="w-full md:w-auto px-10 py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {isVerifyingPin ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
                  {t('verify_pin')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status & Liquidity Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${status?.availability_status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <Activity size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter">{t('usdt_gateway_status')}</h2>
              <p className="text-slate-500 font-bold">{t('gateway_status_desc')}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {(['online', 'offline', 'delayed'] as const).map(s => (
              <button 
                key={s}
                onClick={() => handleUpdateStatus(s)}
                disabled={isUpdatingStatus}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border disabled:opacity-50 ${
                  status?.availability_status === s 
                    ? 'bg-sky-600 border-sky-400 text-white shadow-xl shadow-sky-900/20' 
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                }`}
              >
                {isUpdatingStatus && status?.availability_status !== s ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  s === 'online' ? t('online') : s === 'offline' ? t('offline') : t('delayed')
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{t('available_liquidity_usdt')}</h3>
            <DollarSign className="text-emerald-400" size={20} />
          </div>
          <div className="flex gap-4">
            <input 
              type="number"
              value={status?.usdt_capacity}
              onChange={(e) => handleUpdateStatus(status?.availability_status || 'offline', parseFloat(e.target.value))}
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-2xl text-emerald-400 outline-none focus:border-emerald-500 transition-all"
            />
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center">
              <span className="font-black">USDT</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold text-center">{t('liquidity_routing_desc')}</p>
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
                {t('incoming_transfer_requests')}
              </h3>
              <span className="px-4 py-1 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {t('pending_requests_count').replace('${count}', orders.filter(o => o.status === 'pending_distributor').length.toString())}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-black/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-6">{t('total_amount')}</th>
                    <th className="p-6">{t('net_to_recipient')}</th>
                    <th className="p-6">{t('status')}</th>
                    <th className="p-6">{t('timestamp')}</th>
                    <th className="p-6">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <p className="font-black text-lg">${order.total_amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{t('including_fees')}</p>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-emerald-400 text-lg">${order.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold">USDT</p>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          order.status === 'success_pending_review' ? 'bg-amber-500/10 text-amber-500' :
                          order.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-sky-500/10 text-sky-500'
                        }`}>
                          {(order.status === 'pending_distributor' || order.status === 'pending') ? t('waiting_for_you') : 
                           order.status === 'success_pending_review' ? t('under_review') : 
                           order.status === 'rejected' ? t('rejected') : t('completed')}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-slate-500 font-bold">
                        {new Date(order.created_at).toLocaleString('ar-SA')}
                      </td>
                      <td className="p-6">
                        {(order.status === 'pending_distributor' || order.status === 'pending') && (
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            disabled={!isKeyVerified && !isPinVerified}
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all"
                          >
                            {t('process_order')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-600 font-bold">{t('no_requests_currently')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Key size={16} />
              {t('authorized_flash_keys')}
            </h3>
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                      <CheckCircle size={16} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0x{k.vendor_id.toString(16).toUpperCase()}:0x{k.product_id.toString(16).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{t('active')}</span>
                </div>
              ))}
              {keys.length === 0 && <p className="text-center text-[10px] text-slate-600 font-bold py-4">{t('no_programmed_keys')}</p>}
            </div>
          </div>

          <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">{t('distributor_notice')}</h4>
            <p className="text-sm font-bold text-slate-400 leading-relaxed">
              {t('distributor_notice_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight">{t('process_transfer')}</h3>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('amount_due')}</p>
                    <p className="text-2xl font-black text-sky-400">${selectedOrder.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-sky-500/10 rounded-3xl border border-sky-500/20 space-y-4">
                    <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                      <Wallet size={12} />
                      {t('target_usdt_wallet')}
                    </h4>
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl">
                      <code className="text-sm font-mono text-white break-all">{selectedOrder.wallet_address}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.wallet_address);
                          addNotification('Copied', 'Wallet address copied to clipboard', 'success');
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-sky-400"
                        title="Copy Address"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Upload size={12} />
                        {t('upload_transfer_receipt')}
                      </h4>
                      {receiptFile && <Check size={16} className="text-emerald-500" />}
                    </div>

                    {!receiptPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 text-slate-500 group-hover:text-sky-400 transition-colors mb-3" />
                          <p className="text-sm font-bold text-slate-400">{t('click_to_upload_desc')}</p>
                          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{t('upload_formats_limit')}</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                      </label>
                    ) : (
                      <div className="relative group rounded-2xl overflow-hidden border border-white/10 h-48">
                        <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                            className="p-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                          >
                            {t('remove_change')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OCR Status Indicator */}
                  {ocrStatus !== 'idle' && (
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${
                      ocrStatus === 'processing' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                      ocrStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {ocrStatus === 'processing' ? <RefreshCw className="animate-spin" size={16} /> :
                       ocrStatus === 'success' ? <CheckCircle size={16} /> :
                       <AlertCircle size={16} />}
                      <span className="text-xs font-bold">
                        {ocrStatus === 'processing' ? t('analyzing_ocr') :
                         ocrStatus === 'success' ? t('receipt_validated_success') :
                         t('ocr_failed')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      disabled={isProcessing}
                      className="py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      onClick={handleProcessOrder}
                      disabled={isProcessing || !receiptFile || (!isKeyVerified && !isPinVerified)}
                      className="py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center gap-3"
                    >
                      {isProcessing ? <RefreshCw className="animate-spin" /> : <Zap size={18} />}
                      {t('complete_transfer')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DistributorGatewayManager;
