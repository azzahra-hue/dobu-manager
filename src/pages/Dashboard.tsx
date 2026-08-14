import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar, Award } from 'lucide-react';

export default function Dashboard() {
  const { orders, expenses, products } = useAppContext();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredOrders = orders.filter(o => {
    if (startDate && o.date < startDate) return false;
    if (endDate && o.date > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const totalPendapatan = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  const totalModal = completedOrders.reduce((sum, order) => {
    const product = products.find(p => p.id === order.productId);
    const cost = product?.costPrice || 0;
    return sum + (cost * order.qty);
  }, 0);

  const totalPengeluaran = filteredExpenses.filter(e => e.type !== 'income').reduce((sum, expense) => sum + expense.amount, 0);
  const totalPemasukanTambahan = filteredExpenses.filter(e => e.type === 'income').reduce((sum, expense) => sum + expense.amount, 0);
  const keuntungan = totalPendapatan - totalModal;

  const chartData = [
    { name: 'Omzet', amount: totalPendapatan, fill: '#f97316' },
    { name: 'Modal', amount: totalModal, fill: '#f59e0b' },
    { name: 'Pengeluaran', amount: totalPengeluaran, fill: '#ef4444' },
    { name: 'Keuntungan', amount: keuntungan > 0 ? keuntungan : 0, fill: '#22c55e' }
  ];

  const recentOrders = filteredOrders.slice(0, 5);

  const topProducts = React.useMemo(() => {
    const productSales: Record<string, { qty: number, total: number }> = {};
    completedOrders.forEach(order => {
      if (!productSales[order.productId]) {
        productSales[order.productId] = { qty: 0, total: 0 };
      }
      productSales[order.productId].qty += order.qty;
      productSales[order.productId].total += order.total;
    });

    return Object.entries(productSales)
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Produk Dihapus',
          qty: stats.qty,
          total: stats.total
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }, [completedOrders, products]);

  const podiumProducts = React.useMemo(() => {
    const order = [];
    if (topProducts.length > 1) order.push({ ...topProducts[1], rank: 2 });
    if (topProducts.length > 0) order.push({ ...topProducts[0], rank: 1 });
    if (topProducts.length > 2) order.push({ ...topProducts[2], rank: 3 });
    return order;
  }, [topProducts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Ringkasan Usaha</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-2 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
            >
              Semua Waktu
            </button>
          )}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <Calendar size={18} className="text-gray-400 ml-2" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-none focus:ring-0 outline-none text-gray-600 bg-transparent"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-none focus:ring-0 outline-none text-gray-600 bg-transparent"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-xl flex-shrink-0">
              <TrendingUp size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium truncate">Total Omzet</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate" title={formatRupiah(totalPendapatan)}>{formatRupiah(totalPendapatan)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium truncate">Sisa Modal Saat Ini</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate" title={formatRupiah((totalPemasukanTambahan + totalModal) - totalPengeluaran)}>{formatRupiah((totalPemasukanTambahan + totalModal) - totalPengeluaran)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-50">
            <p className="text-xs text-amber-700 font-medium">Modal Penjualan: <span className="font-bold">{formatRupiah(totalModal)}</span></p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
              <TrendingDown size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium truncate">Belanja / Pengeluaran</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate" title={formatRupiah(totalPengeluaran)}>{formatRupiah(totalPengeluaran)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-green-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl flex-shrink-0">
              <DollarSign size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium truncate">Keuntungan</p>
              <p className={`text-xl lg:text-2xl font-bold truncate ${keuntungan >= 0 ? 'text-green-600' : 'text-red-600'}`} title={formatRupiah(keuntungan)}>
                {formatRupiah(keuntungan)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Grafik Keuangan</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Top Products */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Produk Terlaris</h3>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Award size={20} />
              </div>
            </div>
            <div className="pt-2">
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada data penjualan</p>
              ) : (
                <div className="flex justify-center items-end gap-2 h-48">
                  {podiumProducts.map((product) => (
                    <div key={product.id} className="flex flex-col items-center justify-end flex-1 w-1/3 h-full">
                      <div className="text-center mb-2 px-1">
                        <p className="text-[11px] leading-tight font-bold text-gray-700 line-clamp-2" title={product.name}>{product.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium bg-gray-100 rounded-full px-2 py-0.5 mt-1 inline-block">{product.qty} Terjual</p>
                      </div>
                      <div className={`w-full rounded-t-xl flex justify-center items-start pt-3 shadow-inner relative overflow-hidden ${
                        product.rank === 1 ? 'h-28 bg-gradient-to-t from-amber-200 to-amber-400 border border-amber-300' : 
                        product.rank === 2 ? 'h-20 bg-gradient-to-t from-gray-200 to-gray-300 border border-gray-300' : 
                        'h-16 bg-gradient-to-t from-orange-200 to-orange-300 border border-orange-300'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm bg-white/80 backdrop-blur-sm ${
                          product.rank === 1 ? 'text-amber-600' :
                          product.rank === 2 ? 'text-gray-600' :
                          'text-orange-600'
                        }`}>
                          #{product.rank}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Pesanan Terbaru</h3>
              <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl bg-gray-50/50">
                    <div>
                      <p className="font-semibold text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatRupiah(order.total)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status === 'completed' ? 'Selesai' : order.status === 'pending' ? 'Menunggu' : 'Batal'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
