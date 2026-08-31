import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, FileText, Printer, ArrowRightLeft,
  Eye, Lock,
} from 'lucide-react';
import { useStore } from '@/store';
import { formatRial, formatDate, invoiceTotal } from '@/utils';
import { INVOICE_TYPE_LABELS } from '@/types';
import type { InvoiceType } from '@/types';
import { ConfirmDialog } from '@/components/Modal';
import { InvoiceEditor } from '@/pages/InvoiceEditor';
import { InvoicePrint } from '@/pages/InvoicePrint';

export function Invoices() {
  const { data, deleteInvoice } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all');
  const [editing, setEditing] = useState<{ id: string | null; type: InvoiceType } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data.invoices]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter(inv => {
        if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
        if (!q) return true;
        const contact = data.contacts.find(c => c.id === inv.contactId);
        return inv.number.toLowerCase().includes(q) ||
          (contact?.name.toLowerCase().includes(q) ?? false);
      });
  }, [data.invoices, data.contacts, search, typeFilter]);

  // Editing or creating
  if (editing) {
    return (
      <InvoiceEditor
        editId={editing.id}
        type={editing.type}
        onClose={() => setEditing(null)}
      />
    );
  }

  // Printing
  if (printId) {
    return (
      <InvoicePrint
        invoice={data.invoices.find(i => i.id === printId)!}
        onBack={() => setPrintId(null)}
      />
    );
  }

  const typeColors: Record<InvoiceType, string> = {
    sale: 'bg-emerald-500/20 text-emerald-400',
    purchase: 'bg-blue-500/20 text-blue-400',
    return: 'bg-amber-500/20 text-amber-400',
    proforma: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">مدیریت فاکتورها</h1>
          <p className="text-sm text-slate-400 mt-1">فروش، خرید، پیش‌فاکتور و برگشتی</p>
        </div>
      </div>

      {/* New invoice buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['sale', 'purchase', 'proforma', 'return'] as InvoiceType[]).map(t => (
          <button
            key={t}
            className="card p-4 hover:bg-slate-700/30 transition-all hover:scale-[1.02] text-right group"
            onClick={() => setEditing({ id: null, type: t })}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-slate-100">{INVOICE_TYPE_LABELS[t]}</span>
            </div>
            <p className="text-xs text-slate-500">صدور {INVOICE_TYPE_LABELS[t]} جدید</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-full !pr-10"
            placeholder="جستجو بر اساس شماره یا نام شخص..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as InvoiceType | 'all')}
        >
          <option value="all">همه نوع‌ها</option>
          {(['sale', 'purchase', 'proforma', 'return'] as InvoiceType[]).map(t => (
            <option key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="th">شماره</th>
                <th className="th">نوع</th>
                <th className="th">شخص</th>
                <th className="th">تاریخ</th>
                <th className="th">مبلغ کل</th>
                <th className="th">وضعیت</th>
                <th className="th">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td text-center text-slate-500 py-8">
                    فاکتوری یافت نشد.
                  </td>
                </tr>
              ) : filtered.map(inv => {
                const contact = data.contacts.find(c => c.id === inv.contactId);
                const locked = inv.paymentLocked;
                return (
                  <tr key={inv.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="td font-mono text-xs">{inv.number}</td>
                    <td className="td">
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColors[inv.type]}`}>
                        {INVOICE_TYPE_LABELS[inv.type]}
                      </span>
                    </td>
                    <td className="td text-slate-200">{contact?.name ?? '—'}</td>
                    <td className="td text-slate-400 text-xs">{formatDate(inv.date)}</td>
                    <td className="td font-bold text-emerald-400">{formatRial(invoiceTotal(inv.lines, inv))} ریال</td>
                    <td className="td">
                      {locked ? (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Lock size={12} /> قفل پرداخت
                        </span>
                      ) : inv.paid ? (
                        <span className="text-xs text-emerald-400">پرداخت‌شده</span>
                      ) : (
                        <span className="text-xs text-slate-500">نپرداخته</span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" onClick={() => setPrintId(inv.id)} title="چاپ">
                          <Printer size={16} />
                        </button>
                        <button className="btn btn-ghost !p-1.5" onClick={() => setEditing({ id: inv.id, type: inv.type })} title="ویرایش">
                          <Edit3 size={16} />
                        </button>
                        {!locked && (
                          <button className="btn btn-ghost !p-1.5 hover:!text-red-400" onClick={() => setDeleteId(inv.id)} title="حذف">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف فاکتور"
        message="آیا از حذف این فاکتور مطمئن هستید؟ در صورت اتصال به پرداخت قفل‌شده، حذف امکان‌پذیر نیست."
        onConfirm={() => {
          if (deleteId) deleteInvoice(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
