import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, TrendingUp, Save, Percent, AlertTriangle, Table,
} from 'lucide-react';
import { useStore } from '@/store';
import { formatRial, effectiveStock } from '@/utils';
import { UNIT_LIST } from '@/types';
import type { Product, Unit } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';

export function Products() {
  const { data, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    data.products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [data.products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [data.products, search, categoryFilter]);

  // Inline edit state
  const [inlineId, setInlineId] = useState<string | null>(null);
  const [inlineField, setInlineField] = useState<'salePrice' | 'purchasePrice' | null>(null);
  const [inlineValue, setInlineValue] = useState('');
  const inlineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineId && inlineField && inlineRef.current) {
      inlineRef.current.focus();
      inlineRef.current.select();
    }
  }, [inlineId, inlineField]);

  const startInline = (p: Product, field: 'salePrice' | 'purchasePrice') => {
    setInlineId(p.id);
    setInlineField(field);
    setInlineValue(String(p[field]));
  };

  const commitInline = () => {
    if (!inlineId || !inlineField) return;
    const val = parseFloat(inlineValue) || 0;
    updateProduct(inlineId, { [inlineField]: val });
    setInlineId(null);
    setInlineField(null);
    setInlineValue('');
  };

  const cancelInline = () => {
    setInlineId(null);
    setInlineField(null);
    setInlineValue('');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">مدیریت کالاها</h1>
          <p className="text-sm text-slate-400 mt-1">برای ویرایش قیمت، روی آن کلیک کنید</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowBulk(true)}>
            <Percent size={16} /> ویرایش گروهی قیمت
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> کالای جدید
          </button>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-full !pr-10"
            placeholder="جستجو بر اساس نام یا کد..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">همه دسته‌بندی‌ها</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="th">کد</th>
                <th className="th">نام کالا</th>
                <th className="th">دسته‌بندی</th>
                <th className="th">واحد</th>
                <th className="th">موجودی</th>
                <th className="th">قیمت خرید</th>
                <th className="th">قیمت فروش</th>
                <th className="th">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="td text-center text-slate-500 py-8">
                    کالایی یافت نشد. روی «کالای جدید» بزنید.
                  </td>
                </tr>
              ) : filtered.map(p => {
                const stock = effectiveStock(p.id, p.stock, data.invoices);
                const lowStock = stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="td font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="td font-medium text-slate-100">{p.name}</td>
                    <td className="td text-slate-400 text-xs">{p.category || '—'}</td>
                    <td className="td text-slate-400">{p.unit}</td>
                    <td className="td">
                      <span className={`font-bold ${lowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                        {formatRial(stock)}
                      </span>
                      {lowStock && <AlertTriangle size={12} className="inline mr-1 text-amber-400" />}
                    </td>
                    {/* Inline editable: purchase price */}
                    <td className="td">
                      {inlineId === p.id && inlineField === 'purchasePrice' ? (
                        <input
                          ref={inlineRef}
                          className="input !py-1 !px-2 w-28 text-left"
                          type="number"
                          value={inlineValue}
                          onChange={e => setInlineValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitInline();
                            if (e.key === 'Escape') cancelInline();
                          }}
                          onBlur={commitInline}
                        />
                      ) : (
                        <span
                          className="cursor-text hover:text-emerald-400 hover:bg-slate-700/30 px-2 py-1 rounded transition-colors"
                          onClick={() => startInline(p, 'purchasePrice')}
                        >
                          {formatRial(p.purchasePrice)}
                        </span>
                      )}
                    </td>
                    {/* Inline editable: sale price */}
                    <td className="td">
                      {inlineId === p.id && inlineField === 'salePrice' ? (
                        <input
                          ref={inlineRef}
                          className="input !py-1 !px-2 w-28 text-left"
                          type="number"
                          value={inlineValue}
                          onChange={e => setInlineValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitInline();
                            if (e.key === 'Escape') cancelInline();
                          }}
                          onBlur={commitInline}
                        />
                      ) : (
                        <span
                          className="cursor-text hover:text-emerald-400 hover:bg-slate-700/30 px-2 py-1 rounded transition-colors font-bold"
                          onClick={() => startInline(p, 'salePrice')}
                        >
                          {formatRial(p.salePrice)}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" onClick={() => setEditingId(p.id)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-ghost !p-1.5 hover:!text-red-400" onClick={() => setDeleteId(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <ProductForm
          onClose={() => setShowAdd(false)}
          onSave={(p) => {
            addProduct(p);
            setShowAdd(false);
          }}
          nextCode={String(data.counters.product + 1).padStart(4, '0')}
          categories={categories}
        />
      )}
      {editingId && (
        <ProductForm
          product={data.products.find(p => p.id === editingId) ?? null}
          onClose={() => setEditingId(null)}
          onSave={(p) => {
            updateProduct(editingId, p);
            setEditingId(null);
          }}
          categories={categories}
        />
      )}

      {/* Bulk Price Modal */}
      {showBulk && (
        <BulkPriceModal
          products={data.products}
          categories={categories}
          onClose={() => setShowBulk(false)}
          onApplyPercent={(field, pct, category) => {
            const target = category === 'all'
              ? data.products
              : data.products.filter(p => p.category === category);
            for (const p of target) {
              const oldVal = p[field];
              const newVal = Math.round(oldVal * (1 + pct / 100));
              updateProduct(p.id, { [field]: newVal });
            }
            setShowBulk(false);
          }}
          onApplyManual={(updates) => {
            for (const u of updates) {
              updateProduct(u.id, { salePrice: u.salePrice });
            }
            setShowBulk(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف کالا"
        message="آیا از حذف این کالا مطمئن هستید؟ این عمل قابل بازگشت نیست."
        onConfirm={() => {
          if (deleteId) deleteProduct(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function ProductForm({
  product, onClose, onSave, nextCode, categories,
}: {
  product?: Product | null;
  onClose: () => void;
  onSave: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  nextCode?: string;
  categories: string[];
}) {
  const [sku, setSku] = useState(product?.sku ?? nextCode ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [unit, setUnit] = useState<Unit>(product?.unit ?? 'عدد');
  const [category, setCategory] = useState(product?.category ?? '');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(product?.minStock ?? 0));
  const [purchasePrice, setPurchasePrice] = useState(String(product?.purchasePrice ?? 0));
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? 0));
  const [barcode, setBarcode] = useState(product?.barcode ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      sku: sku.trim() || (nextCode ?? ''),
      name: name.trim(),
      unit,
      category: category.trim(),
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      barcode: barcode.trim(),
    });
  };

  return (
    <Modal open onClose={onClose} title={product ? 'ویرایش کالا' : 'کالای جدید'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">کد کالا (SKU)</label>
            <input className="input w-full" value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div>
            <label className="label">بارکد</label>
            <input className="input w-full" value={barcode} onChange={e => setBarcode(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">نام کالا *</label>
          <input className="input w-full" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">دسته‌بندی</label>
            <input
              className="input w-full"
              value={category}
              onChange={e => setCategory(e.target.value)}
              list="category-list"
              placeholder="مثلاً: نوشیدنی"
            />
            <datalist id="category-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">واحد</label>
            <select className="input w-full" value={unit} onChange={e => setUnit(e.target.value as Unit)}>
              {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">موجودی اولیه</label>
            <input className="input w-full text-left" type="number" value={stock} onChange={e => setStock(e.target.value)} />
          </div>
          <div>
            <label className="label">حداقل موجودی</label>
            <input className="input w-full text-left" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">قیمت خرید (ریال)</label>
            <input className="input w-full text-left" type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
          </div>
          <div>
            <label className="label">قیمت فروش (ریال)</label>
            <input className="input w-full text-left" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> ذخیره
          </button>
        </div>
      </div>
    </Modal>
  );
}

type BulkMode = 'percent' | 'manual';

function BulkPriceModal({
  products, categories, onClose, onApplyPercent, onApplyManual,
}: {
  products: Product[];
  categories: string[];
  onClose: () => void;
  onApplyPercent: (field: 'salePrice' | 'purchasePrice', pct: number, category: string) => void;
  onApplyManual: (updates: { id: string; salePrice: number }[]) => void;
}) {
  const [mode, setMode] = useState<BulkMode>('percent');
  const [field, setField] = useState<'salePrice' | 'purchasePrice'>('salePrice');
  const [pct, setPct] = useState('10');
  const [category, setCategory] = useState('all');

  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});

  const targetProducts = useMemo(() => {
    return category === 'all'
      ? products
      : products.filter(p => p.category === category);
  }, [products, category]);

  const handleApplyPercent = () => {
    onApplyPercent(field, parseFloat(pct) || 0, category);
  };

  const handleApplyManual = () => {
    const updates: { id: string; salePrice: number }[] = [];
    for (const p of targetProducts) {
      const val = manualPrices[p.id];
      if (val !== undefined && val.trim() !== '') {
        updates.push({ id: p.id, salePrice: parseFloat(val) || 0 });
      }
    }
    if (updates.length > 0) onApplyManual(updates);
  };

  return (
    <Modal open onClose={onClose} title="ویرایش گروهی قیمت‌ها" size="xl">
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-2">
          <button
            className={`btn ${mode === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('percent')}
          >
            <Percent size={16} /> درصدی
          </button>
          <button
            className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('manual')}
          >
            <Table size={16} /> ویرایش دستی
          </button>
        </div>

        {/* Category filter */}
        <div>
          <label className="label">دسته‌بندی</label>
          <select className="input w-full" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">همه کالاها ({products.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c} ({products.filter(p => p.category === c).length})</option>
            ))}
          </select>
        </div>

        {mode === 'percent' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">فیلد قیمت</label>
                <select className="input w-full" value={field} onChange={e => setField(e.target.value as 'salePrice' | 'purchasePrice')}>
                  <option value="salePrice">قیمت فروش</option>
                  <option value="purchasePrice">قیمت خرید</option>
                </select>
              </div>
              <div>
                <label className="label">درصد تغییر</label>
                <input className="input w-full text-left" type="number" value={pct} onChange={e => setPct(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              مثلاً ۱۰ برای ۱۰٪ افزایش یا ۱۰- برای ۱۰٪ کاهش. تعداد کالاهای تحت تأثیر: {targetProducts.length}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
              <button className="btn btn-primary" onClick={handleApplyPercent}>
                <TrendingUp size={16} /> اعمال
              </button>
            </div>
          </>
        )}

        {mode === 'manual' && (
          <>
            <p className="text-xs text-slate-500">
              قیمت فروش کالاهای زیر را به‌صورت دستی ویرایش کنید. فقط کالاهایی که قیمت آن‌ها را تغییر دهید، ذخیره می‌شوند.
            </p>
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto rounded-lg border border-slate-700/50">
              <table className="w-full min-w-[500px]">
                <thead className="bg-slate-900/60 sticky top-0">
                  <tr>
                    <th className="th">نام کالا</th>
                    <th className="th">قیمت فعلی</th>
                    <th className="th">قیمت جدید</th>
                  </tr>
                </thead>
                <tbody>
                  {targetProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-700/20">
                      <td className="td text-slate-100 font-medium">{p.name}</td>
                      <td className="td text-slate-400">{formatRial(p.salePrice)}</td>
                      <td className="td">
                        <input
                          className="input !py-1 !px-2 w-32 text-left"
                          type="number"
                          placeholder={String(p.salePrice)}
                          value={manualPrices[p.id] ?? ''}
                          onChange={e => setManualPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
              <button className="btn btn-primary" onClick={handleApplyManual}>
                <Save size={16} /> ذخیره تغییرات
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
