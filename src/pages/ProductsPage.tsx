import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { Plus, Trash2, Package, Edit2, Check, X } from 'lucide-react';
import { Product } from '../types';

export default function ProductsPage() {
  const { products, addProduct, deleteProduct, updateProduct } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', icon: '', costPrice: '', priceDanus: '', pricePO: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '', costPrice: '', priceDanus: '', pricePO: '' });

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
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name || !editForm.costPrice || !editForm.priceDanus || !editForm.pricePO) return;
    await updateProduct(id, {
      name: editForm.name,
      icon: editForm.icon,
      costPrice: parseFloat(editForm.costPrice),
      priceDanus: parseFloat(editForm.priceDanus),
      pricePO: parseFloat(editForm.pricePO),
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Katalog Produk</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus size={20} />
          {isAdding ? 'Batal' : 'Tambah Produk'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 max-w-5xl">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-1 w-20 flex-shrink-0">
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
            <div className="space-y-1 flex-1 w-full">
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
            <div className="space-y-1 flex-1 w-full">
              <label className="text-sm font-medium text-gray-600">Modal/HPP (Rp)</label>
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
            <div className="space-y-1 flex-1 w-full">
              <label className="text-sm font-medium text-gray-600">Harga Danus (Rp)</label>
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
            <div className="space-y-1 flex-1 w-full">
              <label className="text-sm font-medium text-gray-600">Harga PO (Rp)</label>
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
            <button type="submit" className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => {
          const isEditing = editingId === product.id;
          return (
            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col group relative">
              {isEditing ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex gap-2">
                    <div className="w-16">
                      <label className="text-xs font-medium text-gray-500">Ikon</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none text-center"
                        value={editForm.icon}
                        onChange={e => setEditForm({...editForm, icon: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">Nama Produk</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Modal/HPP</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      value={editForm.costPrice}
                      onChange={e => setEditForm({...editForm, costPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Harga Danus</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      value={editForm.priceDanus}
                      onChange={e => setEditForm({...editForm, priceDanus: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Harga PO</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      value={editForm.pricePO}
                      onChange={e => setEditForm({...editForm, pricePO: e.target.value})}
                    />
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <button 
                      onClick={() => handleSaveEdit(product.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={16} /> Simpan
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={16} /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 text-sky-600 rounded-xl flex items-center justify-center text-2xl">
                      {product.icon ? product.icon : <Package size={24} />}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</h3>
                  <div className="mt-2 mb-4 space-y-1">
                    <p className="text-gray-600 font-medium text-sm">Modal/HPP: {formatRupiah(product.costPrice || 0)}</p>
                    <p className="text-sky-600 font-bold text-sm">Danus: {formatRupiah(product.priceDanus)}</p>
                    <p className="text-blue-600 font-bold text-sm">PO: {formatRupiah(product.pricePO)}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-sky-600 hover:bg-sky-50 py-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} /> Hapus
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
