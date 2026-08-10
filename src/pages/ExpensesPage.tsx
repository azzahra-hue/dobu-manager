import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/format';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  
  const [newExpense, setNewExpense] = useState<{
    date: string;
    description: string;
    amount: string;
    type: 'income' | 'expense';
  }>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    
    addExpense({
      date: newExpense.date,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      type: newExpense.type
    });
    
    setNewExpense({ ...newExpense, description: '', amount: '' });
    setIsAdding(false);
  };

  const totalPengeluaran = expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalPemasukan = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catatan Keuangan (Lainnya)</h2>
          <div className="flex gap-4 mt-1">
            <p className="text-gray-500 text-sm">Pemasukan: <span className="font-bold text-green-600">{formatRupiah(totalPemasukan)}</span></p>
            <p className="text-gray-500 text-sm">Pengeluaran: <span className="font-bold text-red-600">{formatRupiah(totalPengeluaran)}</span></p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus size={20} />
          {isAdding ? 'Batal' : 'Catat Transaksi'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Tanggal</label>
              <input 
                type="date" 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newExpense.date}
                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Jenis Transaksi</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newExpense.type}
                onChange={e => setNewExpense({...newExpense, type: e.target.value as 'income' | 'expense'})}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan (Sisa Modal/dll)</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Keterangan</label>
              <input 
                type="text" 
                required
                placeholder={newExpense.type === 'expense' ? "Cth: Beli Plastik, Gula" : "Cth: Sisa modal sebelumnya"}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Nominal (Rp)</label>
              <input 
                type="number" 
                min="0"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
              />
            </div>
            <div className="md:col-span-5 flex justify-end">
              <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm w-12">Jenis</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Tanggal</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Keterangan</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Nominal</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada catatan transaksi</td></tr>
              ) : (
                expenses.map(expense => {
                  const isIncome = expense.type === 'income';
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className={`p-2 rounded-lg inline-flex ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(expense.date)}</td>
                      <td className="p-4 font-medium text-gray-800">{expense.description}</td>
                      <td className={`p-4 font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatRupiah(expense.amount)}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
