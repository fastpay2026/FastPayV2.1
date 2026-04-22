import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ setFormData }: { setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  useMapEvents({
    click: (e) => {
      setFormData(prev => ({ ...prev, lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }));
    },
  });
  return null;
}

interface ChargingPoint {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  address_details: string;
}

export const ChargingPointsPage: React.FC = () => {
  const [points, setPoints] = useState<ChargingPoint[]>([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [formData, setFormData] = useState({ name: '', country: '', lat: '', lng: '', address: '' });

  useEffect(() => {
    fetchPoints();
    const channel = supabase.channel('charging_points_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_points' }, () => fetchPoints())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPoints = async () => {
    const { data } = await supabase.from('charging_points').select('*').order('created_at', { ascending: false });
    if (data) setPoints(data);
  };

  const addPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lat || !formData.lng || !formData.country) {
      alert("يرجى تعبئة كافة الحقول");
      return;
    }
    const { error } = await supabase.from('charging_points').insert({
      name: formData.name,
      country: formData.country,
      latitude: parseFloat(formData.lat),
      longitude: parseFloat(formData.lng),
      address_details: formData.address
    });
    if (error) {
      console.error("Error inserting charging point:", error);
      alert("خطأ أثناء الإضافة: " + error.message);
    } else {
      setFormData({ name: '', country: '', lat: '', lng: '', address: '' });
    }
  };

  const deletePoint = async (id: string) => {
    await supabase.from('charging_points').delete().eq('id', id);
  };

  const filteredPoints = points.filter(p => !filterCountry || p.country.toLowerCase().includes(filterCountry.toLowerCase()));

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-white shadow-xl">
      <h2 className="text-2xl font-bold mb-6">إدارة نقاط الشحن</h2>
      
      <div className="bg-slate-800 p-6 rounded-lg mb-8">
        <MapContainer center={[24.774265, 46.738586]} zoom={4} className="h-64 rounded-lg mb-4">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler setFormData={setFormData} />
          {formData.lat && formData.lng && <Marker position={[parseFloat(formData.lat), parseFloat(formData.lng)]} />}
        </MapContainer>
        <form onSubmit={addPoint} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="اسم النقطة" className="bg-slate-700 p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="الدولة" className="bg-slate-700 p-2 rounded" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
          <input placeholder="العنوان" className="bg-slate-700 p-2 rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <input readOnly placeholder="خط العرض" className="bg-slate-700/50 p-2 rounded cursor-not-allowed" value={formData.lat} />
          <input readOnly placeholder="خط الطول" className="bg-slate-700/50 p-2 rounded cursor-not-allowed" value={formData.lng} />
          <button className="bg-blue-600 p-2 rounded font-bold hover:bg-blue-500">إضافة نقطة</button>
        </form>
      </div>

      <div className="mb-4">
        <input placeholder="بحث بالدولة..." className="bg-slate-800 p-2 rounded w-full md:w-1/3" value={filterCountry} onChange={e => setFilterCountry(e.target.value)} />
      </div>

      <table className="w-full text-right border-collapse border border-slate-700">
        <thead className="bg-slate-950 text-slate-400">
          <tr><th className="p-3">الاسم</th><th className="p-3">الدولة</th><th className="p-3">الإحداثيات</th><th className="p-3">الحالة</th><th className="p-3">إجراءات</th></tr>
        </thead>
        <tbody>
          {filteredPoints.map(p => (
            <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-800">
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.country}</td>
              <td className="p-3 text-xs">{p.latitude}, {p.longitude}</td>
              <td className="p-3">{p.is_available ? '✅ متوفر' : '❌ غير متوفر'}</td>
              <td className="p-3">
                <button className="text-red-400 hover:text-red-300" onClick={() => deletePoint(p.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
