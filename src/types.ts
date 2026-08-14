export interface Product {
  id: string;
  name: string;
  icon?: string;
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
  paymentMethod?: string;
  workspaceId: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  type?: 'income' | 'expense';
  workspaceId: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id?: string;
  productId: string;
  basePortion: number;
  ingredients: Ingredient[];
  workspaceId?: string;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
  workspaceId: string;
}
