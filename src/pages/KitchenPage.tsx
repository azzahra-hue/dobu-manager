import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ingredient, Recipe } from '../types';
import { Utensils, Calculator, Plus, Trash2, Save, Copy, CheckCircle, RefreshCw, ChefHat, Sparkles, Filter } from 'lucide-react';

export default function KitchenPage() {
  const { products, recipes, saveRecipe, deleteRecipe, orders } = useAppContext();
  const recipeList = recipes || [];

  // Active view tab: 'calculator' or 'recipes'
  const [activeTab, setActiveTab] = useState<'calculator' | 'recipes'>('calculator');

  // Recipe Manager State
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [editingIngredients, setEditingIngredients] = useState<Ingredient[]>([]);
  const [basePortion, setBasePortion] = useState<number>(1);
  const [recipeSavedMsg, setRecipeSavedMsg] = useState<boolean>(false);

  // Load existing recipe when selected product changes
  useEffect(() => {
    if (!selectedProductId) return;
    const existing = recipeList.find(r => r.productId === selectedProductId);
    if (existing) {
      setBasePortion(existing.basePortion || 1);
      setEditingIngredients(JSON.parse(JSON.stringify(existing.ingredients)));
    } else {
      setBasePortion(1);
      setEditingIngredients([
        { id: 'init-1', name: '', amount: 0, unit: 'gr' }
      ]);
    }
  }, [selectedProductId, recipeList]);

  const handleAddIngredientRow = () => {
    setEditingIngredients(prev => [
      ...prev,
      { id: 'ing-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), name: '', amount: 0, unit: 'gr' }
    ]);
  };

  const handleRemoveIngredientRow = (id: string) => {
    setEditingIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: any) => {
    setEditingIngredients(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    // Filter valid ingredients
    const validIngredients = editingIngredients.filter(
      i => i.name.trim().length > 0 && Number(i.amount) > 0
    );

    const recipe: Recipe = {
      productId: selectedProductId,
      basePortion: Number(basePortion) || 1,
      ingredients: validIngredients
    };

    saveRecipe(recipe);
    setRecipeSavedMsg(true);
    setTimeout(() => setRecipeSavedMsg(false), 2500);
  };

  // Calculator State
  // Map of productId -> target pcs
  const [targetQuantities, setTargetQuantities] = useState<Record<string, number>>({});
  const [selectedBatchForImport, setSelectedBatchForImport] = useState<string>('all');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const handleTargetQtyChange = (productId: string, val: number) => {
    setTargetQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val)
    }));
  };

  // Auto-import quantities from active orders
  const handleImportFromOrders = () => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const filtered = selectedBatchForImport === 'all' 
      ? activeOrders 
      : activeOrders.filter(o => o.batch === selectedBatchForImport);

    const qtyMap: Record<string, number> = {};
    filtered.forEach(o => {
      qtyMap[o.productId] = (qtyMap[o.productId] || 0) + o.qty;
    });

    setTargetQuantities(qtyMap);
  };

  const handleResetCalculator = () => {
    setTargetQuantities({});
  };

  // Compute total ingredients needed
  // Aggregated by name + unit
  const computedIngredients = useMemo(() => {
    const agg: Record<string, { name: string; amount: number; unit: string; usedInProducts: string[] }> = {};

    Object.entries(targetQuantities).forEach(([productId, rawTargetPcs]) => {
      const targetPcs = Number(rawTargetPcs) || 0;
      if (targetPcs <= 0) return;
      let recipe = recipeList.find(r => r.productId === productId);
      const product = products.find(p => p.id === productId);
      const productName = product ? product.name : 'Produk';

      let multiplier = 0;

      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
        const base = recipe.basePortion || 1;
        multiplier = targetPcs / base;
      } else {
        // Auto-fallback: Jika produk "ukuran S" tidak punya resep, ambil dari "ukuran M" (setengahnya)
        if (product && product.name.toLowerCase().includes('ukuran s')) {
          const nameMatchM = product.name.replace(/ukuran s/i, 'ukuran m');
          const productM = products.find(p => p.name.toLowerCase() === nameMatchM.toLowerCase());
          if (productM) {
            const recipeM = recipeList.find(r => r.productId === productM.id);
            if (recipeM && recipeM.ingredients && recipeM.ingredients.length > 0) {
              recipe = recipeM;
              const base = recipeM.basePortion || 1;
              // Kalikan 0.5 karena S adalah setengah dari M
              multiplier = (targetPcs * 0.5) / base;
            }
          }
        }
      }

      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) return;

      recipe.ingredients.forEach(ing => {
        if (!ing.name || ing.amount <= 0) return;
        const key = `${ing.name.trim().toLowerCase()}_${ing.unit.trim().toLowerCase()}`;
        const totalAmountForThis = ing.amount * multiplier;

        if (!agg[key]) {
          agg[key] = {
            name: ing.name.trim(),
            amount: 0,
            unit: ing.unit.trim(),
            usedInProducts: []
          };
        }

        agg[key].amount += totalAmountForThis;
        if (!agg[key].usedInProducts.includes(productName)) {
          agg[key].usedInProducts.push(productName);
        }
      });
    });

    return Object.values(agg).sort((a, b) => a.name.localeCompare(b.name));
  }, [targetQuantities, recipeList, products]);

  const totalTargetPcs = (Object.values(targetQuantities) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
  const uniqueBatches = Array.from(new Set(orders.map(o => o.batch)));

  const handleCopyKitchenSummary = () => {
    let text = `🍳 REKAP BAHAN DAPUR & GRAMASI\n`;
    text += `Total Target Produksi: ${totalTargetPcs} pcs\n`;
    text += `------------------------------------\n\n`;

    if (computedIngredients.length === 0) {
      text += `Belum ada bahan yang dihitung (Resep belum diisi / jumlah pcs masih 0).\n`;
    } else {
      computedIngredients.forEach(item => {
        const formattedAmount = Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(1);
        text += `• ${item.name}: ${formattedAmount} ${item.unit}\n`;
      });
    }

    text += `\n------------------------------------\n`;
    text += `Dicetak dari Dobu Manager - Dapur`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ChefHat className="text-amber-600" size={28} />
            Dapur & Kalkulator Gramasi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Atur gramasi resep per porsi dan hitung otomatis total bahan yang harus disiapkan untuk produksi.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-amber-100/60 p-1 rounded-xl border border-amber-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-900 hover:bg-amber-200/50'
            }`}
          >
            <Calculator size={18} />
            Kalkulator Produksi
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'recipes'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-900 hover:bg-amber-200/50'
            }`}
          >
            <Utensils size={18} />
            Atur Resep & Gramasi
          </button>
        </div>
      </div>

      {/* VIEW 1: KALKULATOR PRODUKSI */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* Quick Import Bar */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Isi Pcs Otomatis dari Pesanan</h3>
                <p className="text-xs text-gray-500">
                  Tarik jumlah pesanan aktif langsung dari daftar pesanan tanpa perlu mengetik satu-satu.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedBatchForImport}
                onChange={e => setSelectedBatchForImport(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Semua Batch Pesanan</option>
                {uniqueBatches.map(b => (
                  <option key={b} value={b}>Batch: {b}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleImportFromOrders}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
              >
                <RefreshCw size={14} />
                Tarik Data Pesanan
              </button>

              {totalTargetPcs > 0 && (
                <button
                  type="button"
                  onClick={handleResetCalculator}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors"
                >
                  Reset Pcs
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Pcs per Produk */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span>📦</span> Target Pcs yang Ingin Dibuat
                </h3>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                  Total: {totalTargetPcs} pcs
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {products.map(product => {
                  const hasRecipe = recipeList.some(r => r.productId === product.id && r.ingredients.length > 0);
                  
                  let isAutoS = false;
                  if (!hasRecipe && product.name.toLowerCase().includes('ukuran s')) {
                    const nameMatchM = product.name.replace(/ukuran s/i, 'ukuran m');
                    const productM = products.find(p => p.name.toLowerCase() === nameMatchM.toLowerCase());
                    if (productM && recipeList.some(r => r.productId === productM.id && r.ingredients.length > 0)) {
                      isAutoS = true;
                    }
                  }
                  
                  const currentQty = targetQuantities[product.id] || 0;

                  return (
                    <div
                      key={product.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        currentQty > 0 
                          ? 'border-amber-400 bg-amber-50/30' 
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-sm truncate">{product.name}</span>
                          {!hasRecipe && !isAutoS && (
                            <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                              Belum ada resep
                            </span>
                          )}
                          {isAutoS && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              Otomatis ½ Resep M
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasRecipe ? 'Gramasi resep tersedia' : isAutoS ? 'Mengikuti ukuran M' : 'Klik tab "Atur Resep" untuk isi bahan'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium hidden sm:inline">Pcs:</span>
                        <input
                          type="number"
                          min="0"
                          value={currentQty === 0 ? '' : currentQty}
                          onChange={e => handleTargetQtyChange(product.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 px-3 py-1.5 text-right font-black text-amber-900 bg-white border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Results / Total Required Ingredients */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-amber-300 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span>🥣</span> Total Kebutuhan Bahan
                  </h3>

                  <button
                    onClick={handleCopyKitchenSummary}
                    disabled={computedIngredients.length === 0}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      copiedSummary
                        ? 'bg-green-600 text-white'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-50'
                    }`}
                  >
                    {copiedSummary ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copiedSummary ? 'Disalin!' : 'Copy Ringkasan'}
                  </button>
                </div>

                {computedIngredients.length === 0 ? (
                  <div className="text-center py-12 px-4 text-gray-400 space-y-2">
                    <Utensils className="mx-auto text-gray-300" size={40} />
                    <p className="text-sm font-medium">Belum ada bahan yang dihitung.</p>
                    <p className="text-xs text-gray-400">
                      Masukkan jumlah pcs pada produk yang sudah memiliki resep/gramasi di samping.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {computedIngredients.map((item, idx) => {
                      const formattedAmount = Number.isInteger(item.amount)
                        ? item.amount
                        : item.amount.toFixed(1);

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-gray-800 text-sm block truncate">{item.name}</span>
                            <span className="text-[10px] text-gray-500 block truncate mt-0.5">
                              Untuk: {item.usedInProducts.join(', ')}
                            </span>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200">
                              {formattedAmount} <span className="text-xs font-semibold text-amber-800">{item.unit}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {computedIngredients.length > 0 && (
                <div className="pt-3 border-t border-amber-200 text-xs text-gray-500 flex justify-between items-center">
                  <span>{computedIngredients.length} Jenis Bahan Dibutuhkan</span>
                  <span className="font-bold text-gray-700">{totalTargetPcs} Pcs Total</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KELOLA RESEP & GRAMASI */}
      {activeTab === 'recipes' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Utensils className="text-amber-500" size={20} />
                Input Gramasi Resep per Produk
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Pilih produk dan tentukan takaran tiap bahan (gram, ml, pcs, sdm) untuk 1 porsi pengerjaan.
              </p>
            </div>

            {/* Select Product */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Produk:</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-amber-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveRecipe} className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                Base Takaran Resep Ini Untuk:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={basePortion}
                  onChange={e => setBasePortion(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 text-center font-bold bg-white border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-sm font-medium text-gray-600">porsi / pcs</span>
              </div>
            </div>

            {/* Ingredients Table / List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Daftar Bahan & Takaran</h4>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Baris Bahan
                </button>
              </div>

              {editingIngredients.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                  Belum ada bahan. Klik tombol "Tambah Baris Bahan" di atas.
                </div>
              ) : (
                <div className="space-y-2">
                  {editingIngredients.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <span className="text-xs font-bold text-gray-400 w-6 text-center">{index + 1}.</span>

                      {/* Ingredient Name */}
                      <input
                        type="text"
                        placeholder="Nama Bahan (mis: Whipping Cream / Biskuit)"
                        value={item.name}
                        onChange={e => handleIngredientChange(item.id, 'name', e.target.value)}
                        className="flex-1 w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-medium text-gray-800 focus:ring-2 focus:ring-amber-500"
                      />

                      {/* Amount */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Jumlah"
                          value={item.amount === 0 ? '' : item.amount}
                          onChange={e => handleIngredientChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-right text-gray-800 focus:ring-2 focus:ring-amber-500"
                        />

                        {/* Unit */}
                        <select
                          value={item.unit}
                          onChange={e => handleIngredientChange(item.id, 'unit', e.target.value)}
                          className="w-24 px-2 py-2 text-sm bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="gr">gram (gr)</option>
                          <option value="ml">milli (ml)</option>
                          <option value="pcs">pcs / buah</option>
                          <option value="sdm">sdm</option>
                          <option value="sdt">sdt</option>
                          <option value="pack">pack</option>
                          <option value="butir">butir</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0"
                          title="Hapus Bahan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {recipeSavedMsg && (
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <CheckCircle size={16} /> Resep berhasil disimpan!
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {recipeList.some(r => r.productId === selectedProductId) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Hapus resep untuk produk ini?')) {
                        deleteRecipe(selectedProductId);
                        setEditingIngredients([]);
                      }
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Hapus Resep
                  </button>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Save size={18} />
                  Simpan Resep & Gramasi
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
