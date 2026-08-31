import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle, FileText,
  Wallet, ArrowLeft, ShoppingBag,
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatRial, invoiceTotal, effectiveStock, formatDate,
} from '@/utils';
import { INVOICE_TYPE_LABELS } from '@/types';
import type { Page } from '@/components/Sidebar';

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { data } = useStore();

  const stats = useMemo(() => {
    let totalSales = 0, totalPurchase = 0, totalReturns = 0;
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (const inv of data.invoices) {
      const total = invoiceTotal(inv.lines, inv);
      if (inv.type === 'sale' && inv.date >= monthAgo) totalSales += total;
      else if (inv.type === 'purchase' && inv.date >= monthAgo) totalPurchase += total;
      else if (inv.type === 'return' && inv.date >= monthAgo) totalReturns += total;
    }

    const lowStock = data.products.filter(p =>
      effectiveStock(p.id, p.stock, data.invoices) <= p.minStock
    );

    const recentInvoices = [...data.invoices]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    const productCount = data.products.length;
    const customerCount = data.contacts.filter(c => c.type === 'customer').length;

    return { totalSales, totalPurchase, totalReturns, lowStock, recentInvoices, productCount, customerCount };
  }, [data]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">داشبورد</h1>
        <p className="text-sm text-slate-400 mt-1">نمای کلی فروش و موجودی فروشگاه</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="فروش این ماه"
          value={formatRial(stats.totalSales) + ' ریال'}
          icon={<TrendingUp size={22} />}
          color="emerald"
          onClick={() => onNavigate('invoices')}
        />
        <SummaryCard
          title="خرید این ماه"
          value={formatRial(stats.totalPurchase) + ' ریال'}
          icon={<TrendingDown size={22} />}
          color="blue"
          onClick={() => onNavigate('invoices')}
        />
        <SummaryCard
          title="تعداد کالاها"
          value={String(stats.productCount)}
          icon={<Package size={22} />}
          color="amber"
          onClick={() => onNavigate('products')}
        />
        <SummaryCard
          title="مشتریان"
          value={String(stats.customerCount)}
          icon={<Wallet size={22} />}
          color="purple"
          onClick={() => onNavigate('contacts')}
        />
      </div>

      {/* Low Stock Alerts */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">هشدار موجودی کم</h2>
          <span className="text-xs text-slate-500 mr-auto">{stats.lowStock.length} کالا</span>
        </div>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">موجودی همه کالاها کافی است.</p>
        ) : (
          <div className="space-y-2">
            {stats.lowStock.slice(0, 6).map(p => {
              const stock = effectiveStock(p.id, p.stock, data.invoices);
              return (
                <div key={p.id} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <ShoppingBag size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">کد: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${stock <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatRial(stock)} {p.unit}
                    </p>
                    <p className="text-xs text-slate-500">حداقل: {formatRial(p.minStock)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">فاکتورهای اخیر</h2>
          <button
            className="btn btn-ghost !py-1 mr-auto text-xs"
            onClick={() => onNavigate('invoices')}
          >
            مشاهده همه <ArrowLeft size={14} />
          </button>
        </div>
        {stats.recentInvoices.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">هنوز فاکتوری ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="th">شماره</th>
                  <th className="th">نوع</th>
                  <th className="th">تاریخ</th>
                  <th className="th">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map(inv => {
                  const contact = data.contacts.find(c => c.id === inv.contactId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => onNavigate('invoices')}
                    >
                      <td className="td font-mono text-xs">{inv.number}</td>
                      <td className="td">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                          {INVOICE_TYPE_LABELS[inv.type]}
                        </span>
                      </td>
                      <td className="td text-slate-400">{contact?.name ?? '—'}</td>
                      <td className="td font-bold text-emerald-400">{formatRial(invoiceTotal(inv.lines, inv))} ریال</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title, value, icon, color, onClick,
}: {
  title: string; value: string; icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-600/20 to-emerald-800/10 text-emerald-400 border-emerald-700/30',
    blue: 'from-blue-600/20 to-blue-800/10 text-blue-400 border-blue-700/30',
    amber: 'from-amber-600/20 to-amber-800/10 text-amber-400 border-amber-700/30',
    purple: 'from-purple-600/20 to-purple-800/10 text-purple-400 border-purple-700/30',
  };
  return (
    <div
      className={`card bg-gradient-to-br ${colors[color]} p-5 cursor-pointer hover:scale-[1.02] transition-transform`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900/40 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-1">{title}</p>
      <p className="text-lg font-bold text-slate-100">{value}</p>
    </div>
  );
}
