
import React, { useState, useEffect } from 'react';
import { User, FXExchangeSettings, DistributorSecurityKey, FXGatewayQueue, DistributorSecurityConfig } from '../../types';
import { supabaseService } from '../../supabaseService';
import { useI18n } from '../../i18n/i18n';
import { Shield, Cpu, Key, Activity, Settings, RefreshCw, Trash2, CheckCircle, XCircle, Clock, Usb, Save, Plus, Lock } from 'lucide-react';

interface Props {
  accounts: User[];
}

const SecureGatewayManager: React.FC<Props> = ({ accounts }) => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<FXExchangeSettings | null>(null);
  const [registry, setRegistry] = useState<DistributorSecurityKey[]>([]);
  const [securityConfigs, setSecurityConfigs] = useState<DistributorSecurityConfig[]>([]);
  const [queue, setQueue] = useState<FXGatewayQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Flash Programming State
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [isReadingUsb, setIsReadingUsb] = useState(false);
  const [usbData, setUsbData] = useState<{ vendorId: number; productId: number; serialNumber: string } | null>(null);
  const [securityPin, setSecurityPin] = useState<string>('');

  const distributors = accounts.filter(a => a.role === 'DISTRIBUTOR');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [s, r, q, c] = await Promise.all([
        supabaseService.getFXExchangeSettings(),
        supabaseService.getDistributorSecurityKeys(),
        supabaseService.getFXGatewayQueue(),
        supabaseService.getDistributorSecurityConfigs()
      ]);
      setSettings(s[0] || {
        id: crypto.randomUUID(),
        usdtBuyRate: 1.0,
        usdtSellRate: 1.0,
        gatewayFeePercent: 1.0,
        minTransferAmount: 10.0,
        isGatewayActive: true,
        updatedAt: new Date().toISOString()
      });
      setRegistry(r);
      setQueue(q);
      setSecurityConfigs(c);
    } catch (error) {
      console.error("Error fetching gateway data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadUsb = async () => {
    setIsReadingUsb(true);
    try {
      // @ts-ignore
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      
      // Some devices require selecting a configuration to access descriptors
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      
      setUsbData({
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber || 'N/A'
      });
      
      alert(`USB Detected: ${device.productName || 'Unknown Device'}`);
    } catch (error) {
      console.error("WebUSB Error:", error);
      alert("Failed to read USB device. Make sure your browser supports WebUSB and you've granted permission.");
    } finally {
      setIsReadingUsb(false);
    }
  };

  const handleProgramFlash = async () => {
    if (!selectedDistributor || !usbData) {
      alert("Please select a distributor and scan a USB device.");
      return;
    }

    setIsSaving(true);
    try {
      const newKey: DistributorSecurityKey = {
        id: crypto.randomUUID(),
        distributorId: selectedDistributor,
        vendorId: usbData.vendorId,
        productId: usbData.productId,
        serialNumber: usbData.serialNumber,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await supabaseService.upsertDistributorSecurityKey(newKey);
      setRegistry([...registry, newKey]);
      setUsbData(null);
      setSelectedDistributor('');
      alert("Flash key registered successfully.");
    } catch (error) {
      alert("Error registering flash key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleKeyStatus = async (key: DistributorSecurityKey) => {
    try {
      const updatedKey: DistributorSecurityKey = {
        ...key,
        status: key.status === 'active' ? 'revoked' : 'active'
      };
      await supabaseService.upsertDistributorSecurityKey(updatedKey);
      setRegistry(registry.map(r => r.id === key.id ? updatedKey : r));
    } catch (error) {
      alert("Error updating key status");
    }
  };

  const handleSaveSettings = async (updatedSettings?: any) => {
    const settingsToSave = updatedSettings || settings;
    if (!settingsToSave) return;
    setIsSaving(true);
    try {
      await supabaseService.upsertFXExchangeSettings(settingsToSave);
      setSettings(settingsToSave);
      alert("Settings saved successfully.");
    } catch (error) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePin = async () => {
    if (!selectedDistributor || !securityPin) {
      alert("Please select a distributor and enter a 6-digit PIN.");
      return;
    }

    if (securityPin.length !== 6) {
      alert("PIN must be exactly 6 digits.");
      return;
    }

    setIsSaving(true);
    try {
      const config: DistributorSecurityConfig = {
        distributorId: selectedDistributor,
        securityPin: securityPin,
        updatedAt: new Date().toISOString()
      };
      await supabaseService.upsertDistributorSecurityConfig(config);
      setSecurityConfigs(prev => {
        const existing = prev.find(c => c.distributorId === selectedDistributor);
        if (existing) {
          return prev.map(c => c.distributorId === selectedDistributor ? config : c);
        }
        return [...prev, config];
      });
      setSecurityPin('');
      alert("Security PIN updated successfully.");
    } catch (error) {
      alert("Error saving security PIN");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-sky-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <Shield className="text-sky-500 w-10 h-10" />
            USDT Gateway & Security Key Management
          </h2>
          <p className="text-slate-400 font-bold mt-2">Manage distributor security keys and global gateway settings</p>
        </div>
        <button onClick={fetchData} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Flash Programming Module */}
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-card p-10 rounded-[3rem] border border-sky-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu size={120} />
            </div>
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Key className="text-sky-400" />
              Register New Distributor Flash Key
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Target Distributor</label>
                  <select 
                    value={selectedDistributor}
                    onChange={(e) => setSelectedDistributor(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white focus:border-sky-500 transition-all outline-none"
                  >
                    <option value="">Select Distributor...</option>
                    {distributors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} (@{d.username})</option>
                    ))}
                  </select>
                </div>

                {/* PIN Fallback Management */}
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security PIN Fallback</h4>
                    <Lock size={16} className="text-slate-600" />
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit PIN"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-center text-xl tracking-[1em] text-sky-400 outline-none focus:border-sky-500"
                    />
                    <button 
                      onClick={handleSavePin}
                      disabled={isSaving || !selectedDistributor || !securityPin}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Update Security PIN
                    </button>
                    {selectedDistributor && securityConfigs.find(c => c.distributorId === selectedDistributor) && (
                      <p className="text-[10px] text-emerald-500 font-bold text-center">PIN is currently set for this distributor</p>
                    )}
                  </div>
                </div>
                
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hardware Detection</h4>
                    <Usb size={16} className={isReadingUsb ? 'animate-spin text-sky-400' : 'text-slate-600'} />
                  </div>
                  
                  {!usbData ? (
                    <button 
                      onClick={handleReadUsb}
                      disabled={isReadingUsb}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                      <RefreshCw size={14} className={isReadingUsb ? 'animate-spin' : ''} />
                      Scan USB Device
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in zoom-in">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Vendor ID:</span>
                        <span className="font-mono text-sky-400 font-bold">0x{usbData.vendorId.toString(16).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Product ID:</span>
                        <span className="font-mono text-sky-400 font-bold">0x{usbData.productId.toString(16).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Serial:</span>
                        <span className="font-mono text-sky-400 font-bold">{usbData.serialNumber}</span>
                      </div>
                      <button 
                        onClick={() => setUsbData(null)}
                        className="w-full py-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300"
                      >
                        Clear & Rescan
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleProgramFlash}
                  disabled={isSaving || !usbData || !selectedDistributor}
                  className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center gap-3"
                >
                  {isSaving ? <RefreshCw className="animate-spin" /> : <Plus size={20} />}
                  Link Physical Security Key
                </button>
              </div>
              
              <div className="bg-black/40 rounded-3xl p-8 border border-white/5 space-y-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Security Instructions</h4>
                <ul className="space-y-3 text-sm font-bold text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500 font-black">01.</span>
                    Connect the physical USB key to your computer.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500 font-black">02.</span>
                    Select the distributor who will receive this key.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500 font-black">03.</span>
                    Click "Scan USB Device" and grant browser permission.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500 font-black">04.</span>
                    Verify the Vendor/Product ID and Serial Number before linking.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Registry Table */}
          <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Shield className="text-emerald-400" size={20} />
                Authorized Flash Registry
              </h3>
              <span className="px-4 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {registry.length} Active Keys
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-black/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-6">Distributor</th>
                    <th className="p-6">Hardware ID (V:P)</th>
                    <th className="p-6">Serial Number</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registry.map(key => {
                    const dist = accounts.find(a => a.id === key.distributorId);
                    return (
                      <tr key={key.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs">
                              {dist?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-black text-sm">{dist?.full_name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500 font-bold">@{dist?.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <code className="text-xs bg-black/40 px-3 py-1 rounded-lg text-sky-400 font-bold border border-white/5">
                            0x{key.vendorId.toString(16).toUpperCase()}:0x{key.productId.toString(16).toUpperCase()}
                          </code>
                        </td>
                        <td className="p-6 text-xs font-mono text-slate-400 font-bold">{key.serialNumber}</td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {key.status}
                          </span>
                        </td>
                        <td className="p-6">
                          <button 
                            onClick={() => handleToggleKeyStatus(key)}
                            className={`p-3 rounded-xl transition-all ${key.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                          >
                            {key.status === 'active' ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Settings & Queue */}
        <div className="space-y-8">
          {/* Exchange Settings */}
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Settings className="text-slate-400" size={20} />
              Gateway Settings
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-sm font-bold text-slate-400">Gateway Status</span>
                <button 
                  onClick={() => settings && handleSaveSettings({ ...settings, isGatewayActive: !settings.isGatewayActive })}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings?.isGatewayActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  {settings?.isGatewayActive ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">USDT Buy Rate</label>
                <input 
                  type="number"
                  value={settings?.usdtBuyRate}
                  onChange={(e) => settings && setSettings({ ...settings, usdtBuyRate: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway Fee (%)</label>
                <input 
                  type="number"
                  value={settings?.gatewayFeePercent}
                  onChange={(e) => settings && setSettings({ ...settings, gatewayFeePercent: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-sky-500"
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl transition-all"
              >
                {isSaving ? <RefreshCw className="animate-spin mx-auto" /> : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Recent Queue Activity */}
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Activity className="text-sky-400" size={20} />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {queue.slice(0, 5).map(item => (
                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black">${item.totalAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{new Date(item.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      item.status === 'success_pending_review' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-sky-500/10 text-sky-500'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-indigo-400 truncate">{item.walletAddress}</p>
                </div>
              ))}
              {queue.length === 0 && <p className="text-center text-slate-500 font-bold text-sm py-8">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureGatewayManager;
