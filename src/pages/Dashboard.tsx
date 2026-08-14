import React from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react';

export default function Dashboard() {
  const { orders, expenses, products } = useAppContext();

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalPendapatan = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  const totalModal = completedOrders.reduce((sum, order) => {
    const product = products.find(p => p.id === order.productId);
    const cost = product?.costPrice || 0;
    return sum + (cost * order.qty);
  }, 0);

  const totalPengeluaran = expenses.filter(e => e.type !== 'income').reduce((sum, expense) => sum + expense.amount, 0);
  const totalPemasukanTambahan = expenses.filter(e => e.type === 'income').reduce((sum, expense) => sum + expense.amount, 0);
  const keuntungan = totalPendapatan - totalModal;

  const chartData = [
    { name: 'Omzet', amount: totalPendapatan, fill: '#f97316' },
    { name: 'Modal', amount: totalModal, fill: '#f59e0b' },
    { name: 'Pengeluaran', amount: totalPengeluaran, fill: '#ef4444' },
    { name: 'Keuntungan', amount: keuntungan > 0 ? keuntungan : 0, fill: '#22c55e' }
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Ringkasan Usaha</h2>
      
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

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium truncate">Total Modal</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate" title={formatRupiah(totalModal)}>{formatRupiah(totalModal)}</p>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Pesanan Terbaru</h3>
            <div className="p-2 bg-amber-100 text-sky-600 rounded-lg">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-4 border border-gray-50 rounded-xl bg-gray-50/50">
                  <div>
                    <p className="font-semibold text-gray-800">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatRupiah(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
  );
}
