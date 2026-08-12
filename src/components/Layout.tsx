import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Wallet, PieChart, Package, LogOut, User, PanelLeftClose, PanelLeftOpen, Menu, ChefHat } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
  { id: 'kitchen', label: 'Dapur', icon: ChefHat },
  { id: 'finances', label: 'Keuangan', icon: Wallet },
  { id: 'profit-sharing', label: 'Bagi Hasil', icon: PieChart },
  { id: 'products', label: 'Produk', icon: Package },
];

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { logout } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-amber-50/50 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-amber-200 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out relative z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 min-h-[73px]">
          {!isCollapsed && (
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-xl font-bold text-sky-900 flex items-center gap-2 truncate">
                <span className="text-2xl">🍪</span> Dobu Manager
              </h1>
              <p className="text-xs text-sky-600/80 truncate">Kelola usaha dengan mudah</p>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto">
              <span className="text-2xl" title="Dobu Manager">🍪</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 text-gray-500 hover:text-sky-900 hover:bg-amber-100 rounded-xl transition-colors ${
              isCollapsed ? 'hidden md:flex mx-auto mt-2' : ''
            }`}
            title={isCollapsed ? 'Perluas Menu' : 'Sembunyikan Menu'}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start px-4'
                } py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-100 text-sky-900 shadow-sm'
                    : 'text-gray-600 hover:bg-amber-100 hover:text-sky-900'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-sky-700' : 'text-gray-400'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-100">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 mb-2`}>
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0" title="Admin">
              <User size={16} />
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'justify-start px-4'
            } py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Top Floating Toggle Header (visible when sidebar is collapsed) */}
        {isCollapsed && (
          <div className="bg-white/80 backdrop-blur-xs border-b border-amber-200/60 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-amber-100/80 hover:bg-amber-200 rounded-lg transition-colors border border-amber-200 shadow-2xs"
              title="Tampilkan Menu Samping"
            >
              <Menu size={16} />
              <span>Tampilkan Menu</span>
            </button>
            <span className="text-xs font-bold text-gray-400">|</span>
            <span className="text-xs font-medium text-gray-600">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>
        )}

        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
