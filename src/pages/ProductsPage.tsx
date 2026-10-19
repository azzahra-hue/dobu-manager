import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/format';
import { Plus, Trash2, Package, Edit2, Check, X, Calendar, History, Info, AlertCircle } from 'lucide-react';
import { Product } from '../types';

export default function ProductsPage() {
  const { products, orders, addProduct, deleteProduct, updateProductWithModalPolicy } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', icon: '', costPrice: '', priceDanus: '', pricePO: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '', costPrice: '', priceDanus: '', pricePO: '' });
  
  // Modal change policy state
  const [modalScope, setModalScope] = useState<'from_date' | 'future' | 'all'>('from_date');
  const [modalEffectiveDate, setModalEffectiveDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewHistoryId, setViewHistoryId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.costPrice || !newProduct.priceDanus || !newProduct.pricePO) return;
    
    addProduct({
      name: newProduct.name,
      icon: newProduct.icon,
      costPrice: parseFloat(newProduct.costPrice),
      priceDanus: parseFloat(newProduct.priceDanus),
      pricePO: parseFloat(newProduct.pricePO),
    });
    setNewProduct({ name: '', icon: '', costPrice: '', priceDanus: '', pricePO: '' });
    setIsAdding(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      icon: product.icon || '',
      costPrice: product.costPrice.toString(),
      priceDanus: product.priceDanus.toString(),
      pricePO: product.pricePO.toString()
    });
    setModalScope('from_date');
    setModalEffectiveDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name || !editForm.costPrice || !editForm.priceDanus || !editForm.pricePO) return;
    setIsSaving(true);
    try {
      const newCost = parseFloat(editForm.costPrice);
      const editingProduct = products.find(p => p.id === id);
      const isCostChanged = editingProduct ? newCost !== editingProduct.costPrice : false;

      await updateProductWithModalPolicy({
        id,
        updates: {
          name: editForm.name,
          icon: editForm.icon,
          costPrice: newCost,
          priceDanus: parseFloat(editForm.priceDanus),
          pricePO: parseFloat(editForm.pricePO),
        },
        modalPolicy: isCostChanged ? {
          scope: modalScope,
          effectiveDate: modalEffectiveDate
        } : undefined
      });
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const editingProduct = products.find(p => p.id === editingId);
  const newCostNum = parseFloat(editForm.costPrice);
  const isCostChanged = editingProduct && !isNaN(newCostNum) && newCostNum !== editingProduct.costPrice;

  // Impact calculations for selected product
  const productOrders = editingId ? orders.filter(o => o.productId === editingId) : [];
  const affectedOrders = modalEffectiveDate ? productOrders.filter(o => o.date >= modalEffectiveDate) : [];
  const protectedOrders = modalEffectiveDate ? productOrders.filter(o => o.date < modalEffectiveDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Katalog Produk</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola varian rasa, harga jual, dan modal HPP produk.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          {isAdding ? 'Batal' : 'Tambah Produk'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 max-w-5xl">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-wrap gap-4 items-end">
            <div className="space-y-1 w-20 flex-none">
              <label className="text-sm font-medium text-gray-600">Ikon</label>
              <input 
                type="text" 
                placeholder="🍪"
                maxLength={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none text-center"
                value={newProduct.icon}
                onChange={e => setNewProduct({...newProduct, icon: e.target.value})}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-gray-600">Nama Produk</label>
              <input 
                type="text" 
                required
                placeholder="Misal: Kue Coklat"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-600">Modal/HPP Satuan</label>
              <input 
                type="number" 
                min="0"
                required
                placeholder="Misal: 20000"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newProduct.costPrice}
                onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-600">Harga Danus</label>
              <input 
                type="number" 
                min="0"
                required
                placeholder="Misal: 35000"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newProduct.priceDanus}
                onChange={e => setNewProduct({...newProduct, priceDanus: e.target.value})}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-600">Harga PO</label>
              <input 
                type="number" 
                min="0"
                required
                placeholder="Misal: 30000"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newProduct.pricePO}
                onChange={e => setNewProduct({...newProduct, pricePO: e.target.value})}
              />
            </div>
            <div className="w-full lg:w-auto flex-none">
              <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => {
          const hasHistory = product.costPriceHistory && product.costPriceHistory.length > 0;
          return (
            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col group relative hover:border-amber-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-100 text-sky-600 rounded-xl flex items-center justify-center text-2xl">
                  {product.icon ? product.icon : <Package size={24} />}
                </div>

                {hasHistory && (
                  <button
                    onClick={() => setViewHistoryId(product.id)}
                    className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
                    title="Lihat riwayat perubahan modal"
                  >
                    <History size={12} />
                    Riwayat Modal
                  </button>
                )}
              </div>
              <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</h3>
              <div className="mt-2 mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Modal/HPP:</span>
                  <span className="font-bold text-gray-800">{formatRupiah(product.costPrice || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-600 font-medium">Danus:</span>
                  <span className="font-bold text-sky-600">{formatRupiah(product.priceDanus)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">PO:</span>
                  <span className="font-bold text-blue-600">{formatRupiah(product.pricePO)}</span>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => handleEdit(product)}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-sky-600 hover:bg-sky-50 py-2 rounded-lg transition-colors border border-sky-100"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors border border-red-100"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Product Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Edit Produk</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ubah nama, harga jual, atau perbarui modal HPP</p>
              </div>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex gap-4">
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ikon</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-center focus:ring-2 focus:ring-sky-500 outline-none"
                    value={editForm.icon}
                    onChange={e => setEditForm({...editForm, icon: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modal / HPP Satuan (Rp)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none font-semibold text-gray-800"
                    value={editForm.costPrice}
                    onChange={e => setEditForm({...editForm, costPrice: e.target.value})}
                  />
                </div>
                {editingProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    Modal saat ini di sistem: <span className="font-semibold text-gray-700">{formatRupiah(editingProduct.costPrice || 0)}</span>
                  </p>
                )}
              </div>

              {/* Dynamic Modal Change Policy Box */}
              {isCostChanged && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-3 transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-600" />
                      Penerapan Perubahan Modal
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {formatRupiah(editingProduct?.costPrice || 0)} ➔ {formatRupiah(newCostNum || 0)}
                    </span>
                  </div>

                  <p className="text-xs text-amber-800">
                    Pilih bagaimana modal baru ini diterapkan pada pesanan:
                  </p>

                  <div className="space-y-2 text-xs">
                    {/* Option 1: Mulai dari tanggal tertentu */}
                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${modalScope === 'from_date' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/50 border-amber-200 hover:bg-white'}`}>
                      <input
                        type="radio"
                        name="modalScope"
                        value="from_date"
                        checked={modalScope === 'from_date'}
                        onChange={() => setModalScope('from_date')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>Mulai orderan tanggal tertentu</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Rekomendasi</span>
                        </div>
                        <div className="text-gray-600 leading-relaxed">
                          Pesanan pada & setelah tanggal yang dipilih akan memakai modal baru ({formatRupiah(newCostNum || 0)}). Orderan sebelumnya <strong>TETAP AMAN</strong> memakai modal lama ({formatRupiah(editingProduct?.costPrice || 0)}).
                        </div>
                        
                        {modalScope === 'from_date' && (
                          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center gap-2">
                            <label className="text-gray-700 font-semibold flex-shrink-0">Mulai Tanggal:</label>
                            <input
                              type="date"
                              value={modalEffectiveDate}
                              onChange={e => setModalEffectiveDate(e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none text-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Option 2: Hanya orderan baru ke depan */}
                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${modalScope === 'future' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/50 border-amber-200 hover:bg-white'}`}>
                      <input
                        type="radio"
                        name="modalScope"
                        value="future"
                        checked={modalScope === 'future'}
                        onChange={() => setModalScope('future')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">
                          Hanya untuk orderan baru berikutnya
                        </div>
                        <div className="text-gray-600 leading-relaxed mt-0.5">
                          Semua pesanan yang sudah tercatat saat ini tidak akan disentuh. Modal baru hanya berlaku untuk pesanan yang diinput setelah ini.
                        </div>
                      </div>
                    </label>

                    {/* Option 3: Semua orderan */}
                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${modalScope === 'all' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/50 border-amber-200 hover:bg-white'}`}>
                      <input
                        type="radio"
                        name="modalScope"
                        value="all"
                        checked={modalScope === 'all'}
                        onChange={() => setModalScope('all')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">
                          Perbarui SEMUA orderan (termasuk yang lama)
                        </div>
                        <div className="text-gray-600 leading-relaxed mt-0.5">
                          Semua pesanan produk ini dari awal akan dihitung ulang dengan modal baru.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Impact Summary Pill */}
                  {modalScope === 'from_date' && modalEffectiveDate && (
                    <div className="p-2.5 bg-amber-100/90 rounded-xl text-xs text-amber-950 flex items-center justify-between border border-amber-200">
                      <span className="flex items-center gap-1 font-medium">
                        <Info size={14} className="text-amber-700 flex-shrink-0" />
                        Ringkasan Pesanan:
                      </span>
                      <span className="font-bold">
                        {affectedOrders.length} pesanan baru | {protectedOrders.length} pesanan lama terlindungi
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Danus</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                    value={editForm.priceDanus}
                    onChange={e => setEditForm({...editForm, priceDanus: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga PO</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                    value={editForm.pricePO}
                    onChange={e => setEditForm({...editForm, pricePO: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => setEditingId(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveEdit(editingId)}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>Menyimpan...</>
                ) : (
                  <>
                    <Check size={18} /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal History Modal */}
      {viewHistoryId && (() => {
        const product = products.find(p => p.id === viewHistoryId);
        if (!product) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">Riwayat Modal / HPP</h3>
                    <p className="text-xs text-gray-500">{product.name}</p>
                  </div>
                </div>
                <button onClick={() => setViewHistoryId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-sky-800 uppercase">Modal Aktif Saat Ini</span>
                    <p className="text-sm font-semibold text-gray-600">Berlaku sekarang</p>
                  </div>
                  <span className="text-lg font-black text-sky-700">{formatRupiah(product.costPrice || 0)}</span>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Riwayat Perubahan</h4>
                  {product.costPriceHistory && product.costPriceHistory.length > 0 ? (
                    <div className="space-y-2">
                      {product.costPriceHistory.slice().reverse().map((h, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500">Mulai berlaku tanggal:</p>
                            <p className="text-sm font-bold text-gray-800">{formatDate(h.effectiveDate)}</p>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{formatRupiah(h.costPrice)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">Belum ada riwayat perubahan.</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button
                  onClick={() => setViewHistoryId(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
