import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Order, Expense, Partner, Recipe } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';

const WORKSPACE_ID = 'admin_bake2026';

interface AppContextType {
  isAuthenticated: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  partners: Partner[];
  recipes: Recipe[];
  saveRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (productId: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'workspaceId'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'workspaceId'>>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'workspaceId'>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'workspaceId'>>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'workspaceId'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updatePartners: (partners: Partner[]) => Promise<void>;
  addPartner: (partner: Omit<Partner, 'id' | 'workspaceId'>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_workspace') === WORKSPACE_ID;
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const login = (u: string, p: string) => {
    if (u === 'admin' && p === 'dobuberkah123') {
      localStorage.setItem('auth_workspace', WORKSPACE_ID);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('auth_workspace');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setOrders([]);
      setExpenses([]);
      setPartners([]);
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qProducts = query(collection(db, 'products'), where('workspaceId', '==', WORKSPACE_ID));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      const loadedProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const getSortWeight = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('cookie')) return 1;
        if (/(?:\bs\b|\(s\)|ukuran s)/i.test(lower)) return 2;
        if (/(?:\bm\b|\(m\)|ukuran m)/i.test(lower)) return 3;
        return 4;
      };

      loadedProducts.sort((a, b) => {
        const weightA = getSortWeight(a.name);
        const weightB = getSortWeight(b.name);
        if (weightA !== weightB) return weightA - weightB;
        return a.name.localeCompare(b.name);
      });

      setProducts(loadedProducts);
    });

    const qOrders = query(collection(db, 'orders'), where('workspaceId', '==', WORKSPACE_ID));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const qExpenses = query(collection(db, 'expenses'), where('workspaceId', '==', WORKSPACE_ID));
    const unsubExpenses = onSnapshot(qExpenses, (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const qPartners = query(collection(db, 'partners'), where('workspaceId', '==', WORKSPACE_ID));
    const unsubPartners = onSnapshot(qPartners, (snap) => {
      let loadedPartners = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
      if (loadedPartners.length === 0) {
        // Initialize default partners
        const p1 = { id: crypto.randomUUID(), name: 'Pemilik (Saya)', percentage: 60, workspaceId: WORKSPACE_ID };
        const p2 = { id: crypto.randomUUID(), name: 'Partner / Investor', percentage: 40, workspaceId: WORKSPACE_ID };
        setDoc(doc(db, 'partners', p1.id), p1);
        setDoc(doc(db, 'partners', p2.id), p2);
      } else {
        setPartners(loadedPartners);
      }
    });

    const qRecipes = query(collection(db, 'recipes'), where('workspaceId', '==', WORKSPACE_ID));
    const unsubRecipes = onSnapshot(qRecipes, (snap) => {
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe)));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubExpenses();
      unsubPartners();
      unsubRecipes();
    };
  }, [isAuthenticated]);

  const saveRecipe = async (recipe: Recipe) => {
    if (!isAuthenticated) return;
    const recipeRef = doc(db, 'recipes', recipe.productId);
    await setDoc(recipeRef, { ...recipe, id: recipe.productId, workspaceId: WORKSPACE_ID });
  };

  const deleteRecipe = async (productId: string) => {
    if (!isAuthenticated) return;
    await deleteDoc(doc(db, 'recipes', productId));
  };

  const addProduct = async (product: Omit<Product, 'id' | 'workspaceId'>) => {
    if (!isAuthenticated) return;
    const newRef = doc(collection(db, 'products'));
    await setDoc(newRef, { ...product, id: newRef.id, workspaceId: WORKSPACE_ID });
  };
  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  };
  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'workspaceId'>>) => {
    if (!isAuthenticated) return;
    await updateDoc(doc(db, 'products', id), updates);
  };
  
  const addOrder = async (order: Omit<Order, 'id' | 'workspaceId'>) => {
    if (!isAuthenticated) return;
    const newRef = doc(collection(db, 'orders'));
    await setDoc(newRef, { ...order, id: newRef.id, workspaceId: WORKSPACE_ID });
  };
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateDoc(doc(db, 'orders', id), { status });
  };
  const updateOrder = async (id: string, updates: Partial<Omit<Order, 'id' | 'workspaceId'>>) => {
    await updateDoc(doc(db, 'orders', id), updates);
  };
  const deleteOrder = async (id: string) => {
    await deleteDoc(doc(db, 'orders', id));
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'workspaceId'>) => {
    if (!isAuthenticated) return;
    const newRef = doc(collection(db, 'expenses'));
    await setDoc(newRef, { ...expense, id: newRef.id, workspaceId: WORKSPACE_ID });
  };
  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const addPartner = async (partner: Omit<Partner, 'id' | 'workspaceId'>) => {
    if (!isAuthenticated) return;
    const newRef = doc(collection(db, 'partners'));
    await setDoc(newRef, { ...partner, id: newRef.id, workspaceId: WORKSPACE_ID });
  };

  const deletePartner = async (id: string) => {
    await deleteDoc(doc(db, 'partners', id));
  };

  const updatePartners = async (newPartners: Partner[]) => {
    if (!isAuthenticated) return;
    for (const partner of newPartners) {
      await updateDoc(doc(db, 'partners', partner.id), { percentage: partner.percentage, name: partner.name });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Memuat data...</div>;

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout, products, orders, expenses, partners, recipes,
      saveRecipe, deleteRecipe,
      addProduct, deleteProduct, updateProduct,
      addOrder, updateOrderStatus, updateOrder, deleteOrder,
      addExpense, deleteExpense,
      updatePartners, addPartner, deletePartner
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
