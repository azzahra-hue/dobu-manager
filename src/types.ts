export interface Product {
  id: string;
  name: string;
  costPrice: number;
  priceDanus: number;
  pricePO: number;
  workspaceId: string;
}

export interface Order {
  id: string;
  batch: string;
  date: string;
  customerName: string;
  productId: string;
  packageType: 'danus' | 'po';
  qty: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  workspaceId: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  workspaceId: string;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
  workspaceId: string;
}
