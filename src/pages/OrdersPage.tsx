import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/format';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Copy, MessageSquare, Upload, Edit2, Check, X, ListChecks, Filter } from 'lucide-react';
import Papa from 'papaparse';

import { Order } from '../types';

export default function OrdersPage() {
  const { orders, products, addOrder, updateOrderStatus, updateOrder, deleteOrder } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showGlobalRecap, setShowGlobalRecap] = useState(false);
  const [selectedRecapBatches, setSelectedRecapBatches] = useState<string[]>([]);
  const [recapPackageFilter, setRecapPackageFilter] = useState<'all' | 'danus' | 'po'>('all');
  const [recapStatusFilter, setRecapStatusFilter] = useState<'active' | 'pending' | 'completed' | 'all' | 'cancelled'>('active');
  
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  const [editBatchValue, setEditBatchValue] = useState<string>('');
  
  const [editingCustomer, setEditingCustomer] = useState<{batch: string, name: string} | null>(null);
  const [editCustomerValue, setEditCustomerValue] = useState<string>('');

  const [editingCustomerFull, setEditingCustomerFull] = useState<{
    originalBatch: string;
    originalName: string;
    batch: string;
    customerName: string;
    date: string;
    items: {
      id: string;
      productId: string;
      packageType: 'danus' | 'po';
      qty: number;
      status: Order['status'];
      isNew?: boolean;
      isDeleted?: boolean;
    }[];
  } | null>(null);

  const handleSaveCustomerFull = async () => {
    if (!editingCustomerFull) return;
    
    for (const item of editingCustomerFull.items) {
      if (item.isDeleted) {
        if (!item.isNew) {
          await deleteOrder(item.id);
        }
        continue;
      }

      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      
      const price = item.packageType === 'danus' ? product.priceDanus : product.pricePO;
      const total = price * item.qty;

      if (item.isNew) {
        await addOrder({
          batch: editingCustomerFull.batch,
          customerName: editingCustomerFull.customerName,
          productId: item.productId,
          packageType: item.packageType,
          qty: item.qty,
          date: editingCustomerFull.date,
          total,
          status: item.status
        });
      } else {
        await updateOrder(item.id, {
          batch: editingCustomerFull.batch,
          customerName: editingCustomerFull.customerName,
          productId: item.productId,
          packageType: item.packageType,
          qty: item.qty,
          date: editingCustomerFull.date,
          total
        });
      }
    }
    setEditingCustomerFull(null);
  };


  const handleSaveBatch = (oldBatch: string) => {
    if (editBatchValue.trim() && editBatchValue.trim() !== oldBatch) {
      const ordersInBatch = orders.filter(o => o.batch === oldBatch);
      ordersInBatch.forEach(o => {
        updateOrder(o.id, { batch: editBatchValue.trim() });
      });
    }
    setEditingBatch(null);
  };

  const handleSaveCustomer = (batch: string, oldName: string) => {
    if (editCustomerValue.trim() && editCustomerValue.trim() !== oldName) {
      const customerOrders = orders.filter(o => o.batch === batch && o.customerName.trim().toLowerCase() === oldName.toLowerCase());
      customerOrders.forEach(o => {
        updateOrder(o.id, { customerName: editCustomerValue.trim() });
      });
    }
    setEditingCustomer(null);
  };
  
  const [newOrder, setNewOrder] = useState({
    batch: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [orderItems, setOrderItems] = useState([
    { id: Date.now().toString(), productId: '', packageType: 'danus' as 'danus' | 'po', qty: 1 }
  ]);

  const updateOrderItem = (id: string, field: string, value: any) => {
    setOrderItems(orderItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const addOrderItem = () => {
    setOrderItems([...orderItems, { id: Date.now().toString(), productId: '', packageType: 'danus', qty: 1 }]);
  };
  
  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let itemsAdded = 0;
    
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const price = item.packageType === 'danus' ? product.priceDanus : product.pricePO;
      
      addOrder({
        batch: newOrder.batch || 'Tanpa Batch',
        customerName: newOrder.customerName,
        productId: item.productId,
        packageType: item.packageType,
        qty: item.qty,
        date: newOrder.date,
        total: price * item.qty,
        status: 'pending'
      });
      itemsAdded++;
    });
    
    if (itemsAdded > 0) {
      setNewOrder({ ...newOrder, customerName: '' });
      setOrderItems([{ id: Date.now().toString(), productId: '', packageType: 'danus', qty: 1 }]);
    }
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
    let text = `Halo ${customer.name}! Berikut rincian pesananmu:\n\n`;
    customer.orders.forEach(o => {
      const pName = getProductName(o.productId);
      text += `• ${o.qty}x ${pName} = ${formatRupiah(o.total)}\n`;
    });
    const total = customer.orders.reduce((sum, o) => sum + o.total, 0);
    text += `\nTotal Tagihan: ${formatRupiah(total)}\n\n`;
    text += `pembayaran dobu⭐\n`;
    text += `* *dana*: 082121690950 (irfah) \n`;
    text += `* *seabank*: 901195619200 (irfah zakiya hamidi)\n`;
    text += `* *spay*: 082121690950 (irfah) _khusus tf sesama spay_\n`;
    text += `* *cash*\n\n`;
    text += `Terimakasih, have a nice day 🍪!`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(customer.orders[0].id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyJarkomBatch = (batchOrders: Order[], productRecap: Record<string, {name: string, qty: number, total: number}>) => {
    let text = `haii terima kasih telah memesan tiramisu dan menjadi mitra dana usahamu di Dobu!🤍\n\n`;
    Object.values(productRecap).forEach(recap => {
      text += `${recap.qty}x ${recap.name} = ${formatRupiah(recap.total)}\n`;
    });
    text += `----------------\n`;
    const totalHarga = batchOrders.reduce((sum, o) => sum + o.total, 0);
    text += `Total harga pesananmu *${formatRupiah(totalHarga)}*\n\n\n`;
    text += `pembayaran dobu⭐\n`;
    text += `* *dana*: 082121690950 (irfah) \n`;
    text += `* *seabank*: 901195619200 (irfah zakiya hamidi)\n`;
    text += `* *spay*: 082121690950 (irfah) _khusus tf sesama spay_\n`;
    text += `* *cash*\n\n`;
    text += `Terimakasih, have a nice day 🍪!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(`batch-${batchOrders[0].batch}`);
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

  // Calculate filtered orders for Global Production Recap
  const filteredRecapOrders = orders.filter(order => {
    if (selectedRecapBatches.length > 0 && !selectedRecapBatches.includes(order.batch)) {
      return false;
    }
    if (recapPackageFilter !== 'all' && order.packageType !== recapPackageFilter) {
      return false;
    }
    if (recapStatusFilter === 'active' && order.status === 'cancelled') {
      return false;
    }
    if (recapStatusFilter === 'pending' && order.status !== 'pending') {
      return false;
    }
    if (recapStatusFilter === 'completed' && order.status !== 'completed') {
      return false;
    }
    if (recapStatusFilter === 'cancelled' && order.status !== 'cancelled') {
      return false;
    }
    return true;
  });

  const globalProductRecap = filteredRecapOrders.reduce((acc, order) => {
    if (!acc[order.productId]) {
      acc[order.productId] = {
        id: order.productId,
        name: getProductName(order.productId),
        qtyDanus: 0,
        qtyPO: 0,
        totalQty: 0,
        totalRevenue: 0
      };
    }
    if (order.packageType === 'danus') {
      acc[order.productId].qtyDanus += order.qty;
    } else {
      acc[order.productId].qtyPO += order.qty;
    }
    acc[order.productId].totalQty += order.qty;
    acc[order.productId].totalRevenue += order.total;
    return acc;
  }, {} as Record<string, { id: string; name: string; qtyDanus: number; qtyPO: number; totalQty: number; totalRevenue: number }>);

  const totalRecapItems = Object.values(globalProductRecap).reduce((sum, r) => sum + r.totalQty, 0);
  const totalRecapRevenue = Object.values(globalProductRecap).reduce((sum, r) => sum + r.totalRevenue, 0);

  const handleCopyProductionRecap = () => {
    let text = `📋 REKAP PRODUKSI PESANAN\n`;
    text += `Batch: ${selectedRecapBatches.length === 0 ? 'Semua Batch' : selectedRecapBatches.join(', ')}\n`;
    text += `Paket: ${recapPackageFilter === 'all' ? 'Semua Paket' : recapPackageFilter.toUpperCase()}\n`;
    text += `Status: ${recapStatusFilter === 'active' ? 'Aktif (Menunggu & Selesai)' : recapStatusFilter.toUpperCase()}\n`;
    text += `--------------------------------\n\n`;

    Object.values(globalProductRecap).forEach(recap => {
      if (recapPackageFilter === 'all' && (recap.qtyDanus > 0 && recap.qtyPO > 0)) {
        text += `• ${recap.totalQty}x ${recap.name} (Danus: ${recap.qtyDanus}, PO: ${recap.qtyPO})\n`;
      } else {
        text += `• ${recap.totalQty}x ${recap.name}\n`;
      }
    });

    text += `\n--------------------------------\n`;
    text += `TOTAL PRODUKSI: ${totalRecapItems} pcs / item\n`;
    text += `Total Nilai Pesanan: ${formatRupiah(totalRecapRevenue)}\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId('global-production-recap');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Kelola Pesanan</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowGlobalRecap(!showGlobalRecap)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm ${
              showGlobalRecap 
                ? 'bg-amber-600 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <ListChecks size={20} />
            {showGlobalRecap ? 'Tutup Rekap' : 'Rekap Produksi'}
          </button>
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

      {showGlobalRecap && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-300 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ListChecks className="text-amber-500" size={24} />
                Rekap Produksi & Total Varian
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Pilih filter batch, jenis paket, atau status pesanan untuk mengetahui total porsi yang harus dibuat.
              </p>
            </div>

            <button
              onClick={handleCopyProductionRecap}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${
                copiedId === 'global-production-recap'
                  ? 'bg-green-600 text-white'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {copiedId === 'global-production-recap' ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copiedId === 'global-production-recap' ? 'Disalin!' : 'Copy Ringkasan Produksi'}
            </button>
          </div>

          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-amber-50/20 p-4 rounded-xl border border-amber-200/60">
            {/* Batch Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Filter size={14} /> Filter Batch
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => setSelectedRecapBatches([])}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border ${
                    selectedRecapBatches.length === 0
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Semua Batch
                </button>
                {uniqueBatches.map(batch => {
                  const isSelected = selectedRecapBatches.includes(batch);
                  return (
                    <button
                      key={batch}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRecapBatches(selectedRecapBatches.filter(b => b !== batch));
                        } else {
                          setSelectedRecapBatches([...selectedRecapBatches, batch]);
                        }
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {batch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Filter size={14} /> Filter Jenis Paket
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'danus', label: 'Danus' },
                  { id: 'po', label: 'PO' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setRecapPackageFilter(type.id as any)}
                    className={`flex-1 py-1.5 px-3 text-xs rounded-lg font-medium transition-colors border text-center ${
                      recapPackageFilter === type.id
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Filter size={14} /> Filter Status Pesanan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'active', label: 'Aktif (Proses & Selesai)' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'completed', label: 'Selesai' },
                  { id: 'all', label: 'Semua Status' },
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRecapStatusFilter(st.id as any)}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-colors border text-center ${
                      recapStatusFilter === st.id
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">Total Item Harus Dibuat</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{totalRecapItems} pcs</div>
            </div>
            <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200">
              <span className="text-xs text-sky-800 font-bold uppercase tracking-wider">Jumlah Varian</span>
              <div className="text-2xl font-black text-sky-900 mt-1">{Object.keys(globalProductRecap).length} Varian</div>
            </div>
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Total Nilai Pesanan</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{formatRupiah(totalRecapRevenue)}</div>
            </div>
          </div>

          {/* Product Table */}
          {Object.keys(globalProductRecap).length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Tidak ada pesanan yang sesuai dengan filter di atas.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                    <th className="p-3">Nama Varian Produk</th>
                    {recapPackageFilter === 'all' && <th className="p-3 text-center">Rincian Paket (Danus / PO)</th>}
                    <th className="p-3 text-right">Total Jumlah Dibuat</th>
                    <th className="p-3 text-right">Total Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {Object.values(globalProductRecap).map(recap => (
                    <tr key={recap.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3 font-bold text-gray-800">{recap.name}</td>
                      {recapPackageFilter === 'all' && (
                        <td className="p-3 text-center">
                          <div className="inline-flex gap-2">
                            {recap.qtyDanus > 0 && (
                              <span className="bg-sky-100 text-sky-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                Danus: {recap.qtyDanus}
                              </span>
                            )}
                            {recap.qtyPO > 0 && (
                              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                PO: {recap.qtyPO}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="p-3 text-right font-black text-amber-700 text-base">
                        <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-200 shadow-xs">
                          {recap.totalQty} pcs
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {formatRupiah(recap.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Tambah Pesanan (Simpan & Tambah Lagi)</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600">Daftar Produk Pesanan</label>
              {orderItems.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</label>
                    <select 
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-sm"
                      value={item.productId}
                      onChange={e => updateOrderItem(item.id, 'productId', e.target.value)}
                    >
                      <option value="" disabled>Pilih Produk...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 w-full md:w-40 flex-none">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paket Harga</label>
                    <select 
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-sm"
                      value={item.packageType}
                      onChange={e => updateOrderItem(item.id, 'packageType', e.target.value as 'danus' | 'po')}
                    >
                      <option value="danus">Danus</option>
                      <option value="po">Pre-Order (PO)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 w-full md:w-32 flex-none">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jumlah (Qty)</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                      value={item.qty}
                      onChange={e => updateOrderItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {orderItems.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeOrderItem(item.id)}
                      className="w-full md:w-auto h-[42px] px-4 text-red-500 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-colors flex-none flex items-center justify-center shadow-sm"
                      title="Hapus Produk"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addOrderItem}
                className="text-sky-600 font-medium text-sm hover:text-sky-700 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors w-fit"
              >
                <Plus size={16} /> Tambah Produk Lain
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-medium p-2.5 rounded-lg transition-colors">
                Simpan Pesanan
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium p-2.5 rounded-lg transition-colors px-6">
                Batal
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
              acc[order.productId] = { name: getProductName(order.productId), qty: 0, total: 0 };
            }
            acc[order.productId].qty += order.qty;
            acc[order.productId].total += order.total;
            return acc;
          }, {} as Record<string, {name: string, qty: number, total: number}>);

          // Group by customer within this batch
          const customersInBatch = batchOrders.reduce((acc, order) => {
            const key = order.customerName.trim().toLowerCase();
            if (!acc[key]) {
              acc[key] = { name: order.customerName.trim(), orders: [] };
            }
            acc[key].orders.push(order);
            return acc;
          }, {} as Record<string, {name: string, orders: Order[]}>);

          const totalRevenue = batchOrders.reduce((sum, o) => sum + o.total, 0);
          const totalCost = batchOrders.reduce((sum, o) => {
            const p = products.find(prod => prod.id === o.productId);
            return sum + ((p?.costPrice || 0) * o.qty);
          }, 0);
          const totalProfit = totalRevenue - totalCost;
          const profitPerPerson = totalProfit / 2;

          return (
            <div key={batch} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="bg-amber-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                  {editingBatch === batch ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editBatchValue}
                        onChange={(e) => setEditBatchValue(e.target.value)}
                        className="border border-amber-300 rounded px-2 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        autoFocus
                      />
                      <button onClick={() => handleSaveBatch(batch)} className="text-green-600 hover:bg-green-100 p-1 rounded-full"><Check size={18}/></button>
                      <button onClick={() => setEditingBatch(null)} className="text-red-500 hover:bg-red-100 p-1 rounded-full"><X size={18}/></button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      {batch}
                      <button onClick={() => { setEditingBatch(batch); setEditBatchValue(batch); }} className="text-gray-400 hover:text-sky-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Total Pesanan: {batchOrders.length}
                  </span>
                  <button 
                    onClick={() => {
                      setEditingCustomerFull({
                        originalBatch: batch,
                        originalName: '',
                        batch: batch,
                        customerName: '',
                        date: new Date().toISOString().split('T')[0],
                        items: [{ id: Date.now().toString(), productId: '', packageType: 'danus', qty: 1, status: 'pending', isNew: true }]
                      });
                    }}
                    className="text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-full border border-sky-100 transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} /> Tambah Pemesan
                  </button>
                </div>
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
                            <td className="p-3 font-medium text-gray-800 align-top pt-4 group/editname">
                              {editingCustomer?.batch === batch && editingCustomer?.name === customer.name ? (
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    value={editCustomerValue}
                                    onChange={(e) => setEditCustomerValue(e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 font-medium outline-none focus:ring-2 focus:ring-sky-500 w-full min-w-[120px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSaveCustomer(batch, customer.name)} className="text-green-600 hover:bg-green-100 p-1 rounded-full"><Check size={16}/></button>
                                    <button onClick={() => setEditingCustomer(null)} className="text-red-500 hover:bg-red-100 p-1 rounded-full"><X size={16}/></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{customer.name}</span>
                                  <button onClick={() => { setEditingCustomer({batch, name: customer.name}); setEditCustomerValue(customer.name); }} className="text-gray-400 hover:text-sky-600 transition-colors opacity-0 group-hover/editname:opacity-100 p-1">
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
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
                                  setEditingCustomerFull({
                                    originalBatch: batch,
                                    originalName: customer.name,
                                    batch: batch,
                                    customerName: customer.name,
                                    date: customer.orders[0]?.date || new Date().toISOString().split('T')[0],
                                    items: customer.orders.map(o => ({
                                      id: o.id,
                                      productId: o.productId,
                                      packageType: o.packageType,
                                      qty: o.qty,
                                      status: o.status
                                    }))
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Pemesan"
                              >
                                <Edit2 size={18} />
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
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-800 text-sm">Rekap Varian ({batch})</h4>
                    <button 
                      onClick={() => handleCopyJarkomBatch(batchOrders, productRecap)}
                      className={`p-1.5 rounded-lg transition-colors ${copiedId === `batch-${batch}` ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-sky-600 hover:bg-sky-50'}`}
                      title="Copy Rekap"
                    >
                      {copiedId === `batch-${batch}` ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {Object.values(productRecap).map((recapRaw, idx) => {
                      const recap = recapRaw as {name: string, qty: number, total: number};
                      return (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{recap.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-md border border-gray-100">{recap.qty}</span>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Pendapatan</span>
                      <span className="font-semibold text-gray-800">{formatRupiah(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Modal</span>
                      <span className="font-semibold text-gray-800">{formatRupiah(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Keuntungan</span>
                      <span className="font-semibold text-green-600">{formatRupiah(totalProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-amber-100">
                      <span className="text-gray-800">Bagi Hasil (per orang)</span>
                      <span className="font-bold text-sky-600">{formatRupiah(profitPerPerson)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {editingCustomerFull && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto mt-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingCustomerFull.originalName ? 'Edit Detail Pesanan' : 'Tambah Pemesan Baru'}</h3>
              <button onClick={() => setEditingCustomerFull(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Batch</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                  value={editingCustomerFull.batch}
                  onChange={e => setEditingCustomerFull({...editingCustomerFull, batch: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                  value={editingCustomerFull.date}
                  onChange={e => setEditingCustomerFull({...editingCustomerFull, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Nama Pemesan</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                  value={editingCustomerFull.customerName}
                  onChange={e => setEditingCustomerFull({...editingCustomerFull, customerName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-gray-600">Daftar Produk</label>
              {editingCustomerFull.items.filter(item => !item.isDeleted).map((item, index) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      value={item.productId}
                      onChange={e => {
                        const newItems = [...editingCustomerFull.items];
                        newItems[editingCustomerFull.items.findIndex(i => i.id === item.id)].productId = e.target.value;
                        setEditingCustomerFull({...editingCustomerFull, items: newItems});
                      }}
                    >
                      <option value="" disabled>Pilih...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 w-full md:w-40 flex-none">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paket</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      value={item.packageType}
                      onChange={e => {
                        const newItems = [...editingCustomerFull.items];
                        newItems[editingCustomerFull.items.findIndex(i => i.id === item.id)].packageType = e.target.value as 'danus' | 'po';
                        setEditingCustomerFull({...editingCustomerFull, items: newItems});
                      }}
                    >
                      <option value="danus">Danus</option>
                      <option value="po">PO</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 w-full md:w-32 flex-none">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</label>
                    <input 
                      type="number" min="1"
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      value={item.qty}
                      onChange={e => {
                        const newItems = [...editingCustomerFull.items];
                        newItems[editingCustomerFull.items.findIndex(i => i.id === item.id)].qty = parseInt(e.target.value) || 1;
                        setEditingCustomerFull({...editingCustomerFull, items: newItems});
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newItems = [...editingCustomerFull.items];
                      newItems[editingCustomerFull.items.findIndex(i => i.id === item.id)].isDeleted = true;
                      setEditingCustomerFull({...editingCustomerFull, items: newItems});
                    }}
                    className="w-full md:w-auto h-[42px] px-4 text-red-500 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-colors flex-none flex items-center justify-center shadow-sm"
                    title="Hapus Produk"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  setEditingCustomerFull({
                    ...editingCustomerFull,
                    items: [...editingCustomerFull.items, { id: Date.now().toString(), productId: '', packageType: 'danus', qty: 1, status: 'pending', isNew: true }]
                  });
                }}
                className="text-sky-600 font-medium text-sm hover:text-sky-700 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors w-fit mt-2"
              >
                <Plus size={16} /> Tambah Produk
              </button>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={handleSaveCustomerFull} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-medium p-3 rounded-lg transition-colors">
                Simpan Perubahan
              </button>
              <button onClick={() => setEditingCustomerFull(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium p-3 rounded-lg transition-colors px-6">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
