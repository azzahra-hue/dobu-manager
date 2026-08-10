import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { Plus, Trash2, Package } from 'lucide-react';

export default function ProductsPage() {
  const { products, addProduct, deleteProduct } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', costPrice: '', priceDanus: '', pricePO: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.costPrice || !newProduct.priceDanus || !newProduct.pricePO) return;
    
    addProduct({
      name: newProduct.name,
      costPrice: parseFloat(newProduct.costPrice),
      priceDanus: parseFloat(newProduct.priceDanus),
      pricePO: parseFloat(newProduct.pricePO),
    });
    setNewProduct({ name: '', costPrice: '', priceDanus: '', pricePO: '' });
    setIsAdding(false);
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 max-w-4xl">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
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
        {products.map(product => (
          <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="w-12 h-12 bg-amber-100 text-sky-600 rounded-xl flex items-center justify-center mb-4">
              <Package size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</h3>
            <div className="mt-2 mb-4 space-y-1">
              <p className="text-gray-600 font-medium text-sm">Modal/HPP: {formatRupiah(product.costPrice || 0)}</p>
              <p className="text-sky-600 font-bold text-sm">Danus: {formatRupiah(product.priceDanus)}</p>
              <p className="text-blue-600 font-bold text-sm">PO: {formatRupiah(product.pricePO)}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-50">
              <button 
                onClick={() => deleteProduct(product.id)}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
