import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/format';
import { Plus, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    addExpense({
      date: newExpense.date,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount)
    });
    
    setNewExpense({ ...newExpense, description: '', amount: '' });
    setIsAdding(false);
  };

  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengeluaran Operasional</h2>
          <p className="text-gray-500 mt-1">Total: <span className="font-bold text-red-600">{formatRupiah(totalPengeluaran)}</span></p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus size={20} />
          {isAdding ? 'Batal' : 'Catat Pengeluaran'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Tanggal</label>
              <input 
                type="date" 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                value={newExpense.date}
                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Keterangan (Cth: Beli Tepung, Gula)</label>
              <input 
                type="text" 
                required
                placeholder="Deskripsi pengeluaran..."
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
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
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
                Simpan Pengeluaran
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
                <th className="p-4 font-semibold text-gray-600 text-sm">Tanggal</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Keterangan</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Nominal</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada catatan pengeluaran</td></tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600">{formatDate(expense.date)}</td>
                    <td className="p-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="p-4 font-bold text-red-600">{formatRupiah(expense.amount)}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
