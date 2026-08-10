import React from 'react';
import { LayoutDashboard, ShoppingCart, Wallet, PieChart, Package, LogOut, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
  { id: 'finances', label: 'Keuangan', icon: Wallet },
  { id: 'profit-sharing', label: 'Bagi Hasil', icon: PieChart },
  { id: 'products', label: 'Produk', icon: Package },
];

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { logout } = useAppContext();

  return (
    <div className="min-h-screen bg-amber-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-amber-200 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sky-900 flex items-center gap-2">
            <span className="text-3xl">🍪</span> Dobu Manager
          </h1>
          <p className="text-sm text-sky-600/80 mt-1">Kelola usaha dengan mudah</p>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-100 text-sky-900 shadow-sm'
                    : 'text-gray-600 hover:bg-amber-100 hover:text-sky-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-sky-700' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
