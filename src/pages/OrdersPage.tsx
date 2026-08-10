import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/format';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Copy, MessageSquare, Upload } from 'lucide-react';
import Papa from 'papaparse';

import { Order } from '../types';

export default function OrdersPage() {
  const { orders, products, addOrder, updateOrderStatus, deleteOrder } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newOrder, setNewOrder] = useState({
    batch: '',
    customerName: '',
    productId: '',
    packageType: 'danus' as 'danus' | 'po',
    qty: 1,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === newOrder.productId);
    if (!product) return;

    const price = newOrder.packageType === 'danus' ? product.priceDanus : product.pricePO;

    addOrder({
      batch: newOrder.batch || 'Tanpa Batch',
      customerName: newOrder.customerName,
      productId: newOrder.productId,
      packageType: newOrder.packageType,
      qty: newOrder.qty,
      date: newOrder.date,
      total: price * newOrder.qty,
      status: 'pending'
    });
    
    setNewOrder({ ...newOrder, customerName: '', qty: 1, productId: '' });
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Produk dihapus';

  // Group orders by batch
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.batch]) {
      acc[order.batch] = [];
    }
    acc[order.batch].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const handleCopyJarkomCustomer = (customer: {name: string, orders: Order[]}) => {
    let text = `Halo ${customer.name},\n\nTerima kasih sudah memesan:\n`;
    customer.orders.forEach(o => {
      const pName = getProductName(o.productId);
      text += `- ${o.qty}x ${pName} (${o.packageType.toUpperCase()})\n`;
    });
    const total = customer.orders.reduce((sum, o) => sum + o.total, 0);
    text += `\nTotal yang harus dibayar: ${formatRupiah(total)}\n\nSilakan lakukan pembayaran agar pesanan segera diproses. Terima kasih! 🍪`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(customer.orders[0].id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        let importCount = 0;
        const failedRows: number[] = [];

        data.forEach((row, index) => {
          const customerName = row['Nama Pemesan'] || row['nama pemesan'] || row['Customer'];
          const productName = row['Produk'] || row['produk'];
          const packageTypeRaw = (row['Paket'] || row['paket'] || 'danus').toLowerCase();
          const packageType = packageTypeRaw === 'po' ? 'po' : 'danus';
          const qty = parseInt(row['Qty'] || row['qty']) || 1;
          const batch = row['Batch'] || row['batch'] || 'Tanpa Batch';
          const date = row['Tanggal'] || row['tanggal'] || new Date().toISOString().split('T')[0];

          if (customerName && productName) {
            const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase().trim());
            if (product) {
              const price = packageType === 'danus' ? product.priceDanus : product.pricePO;
              addOrder({
                batch,
                customerName: customerName.trim(),
                productId: product.id,
                packageType,
                qty,
                date,
                total: price * qty,
                status: 'pending'
              });
              importCount++;
            } else {
              failedRows.push(index + 2); // +2 because 0-index and header row
            }
          }
        });

        if (failedRows.length > 0) {
          alert(`Berhasil mengimpor ${importCount} pesanan.\nBeberapa baris gagal karena produk tidak ditemukan: baris ke-${failedRows.join(', ')}`);
        } else {
          alert(`Berhasil mengimpor ${importCount} pesanan dari CSV.`);
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const uniqueBatches = Array.from(new Set(orders.map(o => o.batch)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kelola Pesanan</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Upload size={20} />
            Import CSV
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            {isAdding ? 'Tutup Form' : 'Pesanan Baru'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Tambah Pesanan (Simpan & Tambah Lagi)</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Batch (Misal: Batch 1)</label>
              <input 
                list="batch-list"
                required
                placeholder="Batch pesanan"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newOrder.batch}
                onChange={e => setNewOrder({...newOrder, batch: e.target.value})}
              />
              <datalist id="batch-list">
                {uniqueBatches.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Tanggal</label>
              <input 
                type="date" 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newOrder.date}
                onChange={e => setNewOrder({...newOrder, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Nama Pemesan</label>
              <input 
                type="text" 
                required
                placeholder="Misal: Budi"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newOrder.customerName}
                onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Produk</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                value={newOrder.productId}
                onChange={e => setNewOrder({...newOrder, productId: e.target.value})}
              >
                <option value="" disabled>Pilih Produk...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Paket Harga</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                value={newOrder.packageType}
                onChange={e => setNewOrder({...newOrder, packageType: e.target.value as 'danus' | 'po'})}
              >
                <option value="danus">Danus</option>
                <option value="po">Pre-Order (PO)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Jumlah (Qty)</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newOrder.qty}
                onChange={e => setNewOrder({...newOrder, qty: parseInt(e.target.value)})}
              />
            </div>
            <div className="lg:col-span-3 flex gap-3">
              <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-medium p-2.5 rounded-lg transition-colors">
                Simpan & Tambah Lagi
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium p-2.5 rounded-lg transition-colors px-6">
                Tutup
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(groupedOrders).length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          Belum ada data pesanan.
        </div>
      ) : (
        Object.entries(groupedOrders).map(([batch, batchOrdersRaw]) => {
          const batchOrders = batchOrdersRaw as Order[];
          
          // Calculate product recap for this batch
          const productRecap = batchOrders.reduce((acc, order) => {
            if (!acc[order.productId]) {
              acc[order.productId] = { name: getProductName(order.productId), qty: 0 };
            }
            acc[order.productId].qty += order.qty;
            return acc;
          }, {} as Record<string, {name: string, qty: number}>);

          // Group by customer within this batch
          const customersInBatch = batchOrders.reduce((acc, order) => {
            const key = order.customerName.trim().toLowerCase();
            if (!acc[key]) {
              acc[key] = { name: order.customerName.trim(), orders: [] };
            }
            acc[key].orders.push(order);
            return acc;
          }, {} as Record<string, {name: string, orders: Order[]}>);

          return (
            <div key={batch} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="bg-amber-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                  {batch}
                </h3>
                <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                  Total Pesanan: {batchOrders.length}
                </span>
              </div>
              
              <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-3 font-semibold text-gray-600 text-sm">Pemesan</th>
                        <th className="p-3 font-semibold text-gray-600 text-sm">Detail Pesanan</th>
                        <th className="p-3 font-semibold text-gray-600 text-sm">Total Tagihan</th>
                        <th className="p-3 font-semibold text-gray-600 text-sm">Status</th>
                        <th className="p-3 font-semibold text-gray-600 text-sm text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(customersInBatch).map((customerRaw) => {
                        const customer = customerRaw as {name: string, orders: Order[]};
                        const totalTagihan = customer.orders.reduce((sum, o) => sum + o.total, 0);
                        const overallStatus = customer.orders.every(o => o.status === 'completed') ? 'completed' 
                                            : customer.orders.every(o => o.status === 'cancelled') ? 'cancelled' 
                                            : 'pending';

                        return (
                          <tr key={customer.name} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-medium text-gray-800 align-top pt-4">{customer.name}</td>
                            <td className="p-3 text-sm text-gray-600 align-top pt-4">
                              <ul className="space-y-2">
                                {customer.orders.map(o => (
                                  <li key={o.id} className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{o.qty}x</span> 
                                    <span>{getProductName(o.productId)}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded-full uppercase font-bold">{o.packageType}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="p-3 font-bold text-gray-900 align-top pt-4">{formatRupiah(totalTagihan)}</td>
                            <td className="p-3 align-top pt-4">
                              <select
                                value={overallStatus}
                                onChange={(e) => {
                                  customer.orders.forEach(o => updateOrderStatus(o.id, e.target.value as any));
                                }}
                                className={`text-xs px-2 py-1.5 rounded-lg font-medium border-0 outline-none cursor-pointer ${
                                  overallStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                  overallStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}
                              >
                                <option value="pending">Menunggu</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Batal</option>
                              </select>
                            </td>
                            <td className="p-3 text-right flex justify-end gap-1 align-top pt-4">
                              <button 
                                onClick={() => handleCopyJarkomCustomer(customer)}
                                className={`p-2 rounded-lg transition-colors ${copiedId === customer.orders[0].id ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                title="Copy Jarkom Pembayaran"
                              >
                                {copiedId === customer.orders[0].id ? <CheckCircle size={18} /> : <MessageSquare size={18} />}
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Hapus semua pesanan atas nama ${customer.name}?`)) {
                                    customer.orders.forEach(o => deleteOrder(o.id));
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Pemesan"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Recap Section for the Batch */}
                <div className="lg:col-span-1 bg-amber-50/30 p-4 rounded-xl border border-amber-200 h-fit">
                  <h4 className="font-bold text-gray-800 text-sm mb-3">Rekap Varian ({batch})</h4>
                  <ul className="space-y-2">
                    {Object.values(productRecap).map((recapRaw, idx) => {
                      const recap = recapRaw as {name: string, qty: number};
                      return (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{recap.name}</span>
                        <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-md border border-gray-100">{recap.qty}</span>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
