import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'];

export default function ProfitSharingPage() {
  const { partners, updatePartners, orders, expenses, products, addPartner, deletePartner } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', percentage: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Calculate total net profit dynamically from completed orders
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalPendapatan = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  const totalModal = completedOrders.reduce((sum, order) => {
    const product = products.find(p => p.id === order.productId);
    const cost = product?.costPrice || 0;
    return sum + (cost * order.qty);
  }, 0);

  const totalPengeluaran = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const keuntunganKotor = totalPendapatan - totalModal;
  const keuntunganBersih = keuntunganKotor - totalPengeluaran;

  const handlePercentageChange = (id: string, newPercentage: number) => {
    const updated = partners.map(p => 
      p.id === id ? { ...p, percentage: newPercentage } : p
    );
    updatePartners(updated);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name) return;
    await addPartner({ name: newPartner.name, percentage: Number(newPartner.percentage) });
    setNewPartner({ name: '', percentage: 0 });
    setIsAdding(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName) return;
    const updated = partners.map(p => 
      p.id === id ? { ...p, name: editName } : p
    );
    await updatePartners(updated);
    setEditingId(null);
  };

  const totalPercentage = partners.reduce((sum, p) => sum + p.percentage, 0);
  const isInvalid = totalPercentage !== 100;

  const chartData = partners.map((p, i) => ({
    name: p.name,
    value: p.percentage,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kalkulator Bagi Hasil</h2>
        <p className="text-gray-500 mt-1">Atur persentase keuntungan untuk masing-masing pihak.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-sm font-medium text-green-800 mb-1">Total Keuntungan Bersih Saat Ini</p>
            <p className={`text-3xl font-bold ${keuntunganBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(keuntunganBersih)}
            </p>
            <div className="mt-4 space-y-1 pt-3 border-t border-green-200 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Total Pendapatan (Omzet)</span>
                <span className="font-semibold">{formatRupiah(totalPendapatan)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Modal (HPP)</span>
                <span className="font-semibold">- {formatRupiah(totalModal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Pengeluaran Ekstra</span>
                <span className="font-semibold">- {formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Atur Persentase</h3>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${isInvalid ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                Total: {totalPercentage}%
              </span>
            </div>
            
            {isInvalid && (
              <p className="text-sm text-red-500 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
                Peringatan: Total persentase harus tepat 100%. Saat ini {totalPercentage}%.
              </p>
            )}

            <div className="space-y-4">
              {partners.map((partner, index) => {
                const shareAmount = keuntunganBersih > 0 ? (keuntunganBersih * partner.percentage) / 100 : 0;
                const isEditing = editingId === partner.id;
                
                return (
                  <div key={partner.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(partner.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {partner.name}
                          </p>
                          <button onClick={() => { setEditingId(partner.id); setEditName(partner.name); }} className="text-gray-400 hover:text-sky-600 p-1 transition-colors">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xl font-bold text-gray-900">{formatRupiah(shareAmount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={partner.percentage}
                          onChange={(e) => handlePercentageChange(partner.id, Number(e.target.value))}
                          className="w-16 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                        />
                        <span className="text-gray-500 font-medium">%</span>
                      </div>
                      <button onClick={() => deletePartner(partner.id)} className="text-gray-400 hover:text-red-500 p-2 transition-opacity" title="Hapus Pihak">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-sky-300 hover:text-sky-600 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Tambah Pihak Penerima Bagi Hasil
              </button>
            ) : (
              <form onSubmit={handleAddPartner} className="mt-4 p-4 border border-sky-100 bg-sky-50/30 rounded-xl space-y-4">
                <h4 className="font-semibold text-gray-800 text-sm">Tambah Pihak Baru</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nama Pihak (Cth: Pegawai)"
                      required
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="w-24 relative">
                    <input
                      type="number"
                      placeholder="%"
                      required
                      min="0"
                      max="100"
                      value={newPartner.percentage || ''}
                      onChange={(e) => setNewPartner({...newPartner, percentage: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium">Simpan</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4 w-full text-left">Distribusi Bagi Hasil</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
