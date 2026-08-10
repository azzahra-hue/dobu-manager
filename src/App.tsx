/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import ExpensesPage from './pages/ExpensesPage';
import ProfitSharingPage from './pages/ProfitSharingPage';
import ProductsPage from './pages/ProductsPage';
import Login from './pages/Login';

function AppContent() {
  const { isAuthenticated } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'orders' && <OrdersPage />}
      {activeTab === 'finances' && <ExpensesPage />}
      {activeTab === 'profit-sharing' && <ProfitSharingPage />}
      {activeTab === 'products' && <ProductsPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
