import { useState, useMemo } from 'react';
import { Search, Package, X } from 'lucide-react';
import { useStore } from '@/store';
import { formatRial, effectiveStock } from '@/utils';
import type { Product } from '@/types';
import { Modal } from '@/components/Modal';

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductPicker({ open, onClose, onSelect }: ProductPickerProps) {
  const { data } = useStore();
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    );
  }, [data.products, search]);

  const handleSelect = (p: Product) => {
    onSelect(p);
    setSearch('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="انتخاب کالا" size="xl">
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-full !pr-10"
            placeholder="جستجو بر اساس نام، کد یا بارکد..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border border-slate-700/50">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-900/60 sticky top-0">
              <tr>
                <th className="th">کد</th>
                <th className="th">نام کالا</th>
                <th className="th">واحد</th>
                <th className="th">موجودی</th>
                <th className="th">قیمت فروش</th>
                <th className="th">قیمت خرید</th>
                <th className="th w-20"></th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td text-center text-slate-500 py-8">
                    کالایی یافت نشد.
                  </td>
                </tr>
              ) : results.map(p => {
                const stock = effectiveStock(p.id, p.stock, data.invoices);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-emerald-600/10 transition-colors cursor-pointer"
                    onClick={() => handleSelect(p)}
                  >
                    <td className="td font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="td font-medium text-slate-100">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-500" />
                        {p.name}
                      </div>
                    </td>
                    <td className="td text-slate-400">{p.unit}</td>
                    <td className="td">
                      <span className={`font-bold ${stock <= p.minStock ? 'text-amber-400' : 'text-slate-200'}`}>
                        {formatRial(stock)}
                      </span>
                    </td>
                    <td className="td text-left text-emerald-400 font-bold">{formatRial(p.salePrice)}</td>
                    <td className="td text-left text-slate-300">{formatRial(p.purchasePrice)}</td>
                    <td className="td">
                      <button className="btn btn-primary !py-1 !px-3 !text-xs">
                        انتخاب
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
