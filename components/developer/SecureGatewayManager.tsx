
import React, { useState, useEffect } from 'react';
import { User, FXExchangeSettings, FXFlashRegistry, FXGatewayQueue } from '../../types';
import { supabaseService } from '../../supabaseService';
import { useI18n } from '../../i18n/i18n';
import { Shield, Cpu, Key, Activity, Settings, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  accounts: User[];
}

const SecureGatewayManager: React.FC<Props> = ({ accounts }) => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<FXExchangeSettings | null>(null);
  const [registry, setRegistry] = useState<FXFlashRegistry[]>([]);
  const [queue, setQueue] = useState<FXGatewayQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Flash Programming State
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [hardwareSignature, setHardwareSignature] = useState<string>('');
  const [isProgramming, setIsProgramming] = useState(false);

  const distributors = accounts.filter(a => a.role === 'DISTRIBUTOR');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [s, r, q] = await Promise.all([
        supabaseService.getFXExchangeSettings(),
        supabaseService.getFXFlashRegistry(),
        supabaseService.getFXGatewayQueue()
      ]);
      setSettings(s || {
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
    } catch (error) {
      console.error("Error fetching gateway data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: FXExchangeSettings) => {
    try {
      await supabaseService.upsertFXExchangeSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      alert("Error updating settings");
    }
  };

  const handleProgramFlash = async () => {
    if (!selectedDistributor || !hardwareSignature) {
      alert("Please select a distributor and enter a hardware signature");
      return;
    }

    setIsProgramming(true);
    try {
      const newKey: FXFlashRegistry = {
        id: crypto.randomUUID(),
        hardwareHash: hardwareSignature,
        distributorId: selectedDistributor,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await supabaseService.upsertFXFlashRegistry(newKey);
      setRegistry([...registry, newKey]);
      setHardwareSignature('');
      setSelectedDistributor('');
      alert("Flash Key Programmed Successfully");
    } catch (error) {
      alert("Error programming flash key");
    } finally {
      setIsProgramming(false);
    }
  };

  const handleToggleKeyStatus = async (key: FXFlashRegistry) => {
    try {
      const updatedKey: FXFlashRegistry = {
        ...key,
        status: key.status === 'active' ? 'revoked' : 'active'
      };
      await supabaseService.upsertFXFlashRegistry(updatedKey);
      setRegistry(registry.map(r => r.id === key.id ? updatedKey : r));
    } catch (error) {
      alert("Error updating key status");
    }
  };

  const generateSignature = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sig = 'FP-';
    for (let i = 0; i < 16; i++) {
      sig += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 15) sig += '-';
    }
    setHardwareSignature(sig);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-sky-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <Shield className="text-sky-500 w-10 h-10" />
            Secure USDT Gateway & Flash Programming
          </h2>
          <p className="text-slate-400 font-bold mt-2">Manage hidden liquidity channels and hardware authentication keys</p>
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
              Flash Key Programming Module
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
                      <option key={d.id} value={d.id}>{d.fullName} (@{d.username})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Hardware Signature (Unique Hash)</label>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={hardwareSignature}
                      onChange={(e) => setHardwareSignature(e.target.value)}
                      placeholder="FP-XXXX-XXXX-XXXX-XXXX"
                      className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 font-mono font-bold text-sky-400 focus:border-sky-500 transition-all outline-none"
                    />
                    <button 
                      onClick={generateSignature}
                      className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl hover:bg-sky-500 hover:text-white transition-all border border-sky-500/20"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleProgramFlash}
                  disabled={isProgramming}
                  className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center gap-3"
                >
                  {isProgramming ? <RefreshCw className="animate-spin" /> : <Cpu size={20} />}
                  Program New Hardware Key
                </button>
              </div>
              
              <div className="bg-black/40 rounded-3xl p-8 border border-white/5 space-y-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Programming Instructions</h4>
                <ul className="space-y-3 text-sm font-bold text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500">01.</span>
                    Connect the target USB/OTG device to the secure terminal.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500">02.</span>
                    Select the distributor who will hold this physical key.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500">03.</span>
                    Generate or enter the hardware's unique signature.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sky-500">04.</span>
                    Flash the registry. The key is now authorized for USDT confirmation.
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
                    <th className="p-6">Hardware Hash</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Last Used</th>
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
                              {dist?.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm">{dist?.fullName || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500 font-bold">@{dist?.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 font-mono text-xs text-sky-400 font-bold">{key.hardwareHash}</td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {key.status}
                          </span>
                        </td>
                        <td className="p-6 text-xs text-slate-500 font-bold">
                          {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
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
                  onClick={() => settings && handleUpdateSettings({ ...settings, isGatewayActive: !settings.isGatewayActive })}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings?.isGatewayActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  {settings?.isGatewayActive ? 'Online' : 'Offline'}
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">USDT Buy Rate (1 USD = ? USDT)</label>
                <input 
                  type="number"
                  value={settings?.usdtBuyRate}
                  onChange={(e) => settings && handleUpdateSettings({ ...settings, usdtBuyRate: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway Fee (%)</label>
                <input 
                  type="number"
                  value={settings?.gatewayFeePercent}
                  onChange={(e) => settings && handleUpdateSettings({ ...settings, gatewayFeePercent: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Min Transfer Amount ($)</label>
                <input 
                  type="number"
                  value={settings?.minTransferAmount}
                  onChange={(e) => settings && handleUpdateSettings({ ...settings, minTransferAmount: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Recent Queue Activity */}
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Activity className="text-sky-400" size={20} />
              Recent Gateway Activity
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
                  {item.txid && <p className="text-[9px] font-mono text-sky-400 truncate">{item.txid}</p>}
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
