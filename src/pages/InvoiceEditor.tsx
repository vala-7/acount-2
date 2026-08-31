import { useState, useMemo } from 'react';
import {
  Save, Plus, Trash2, X, Search, ArrowRight, UserPlus, FileText, Package,
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatRial, invoiceSubtotal, invoiceLineDiscount, invoiceVat,
  invoiceTotal, invoiceGlobalDiscount, lineNet, uid,
  effectiveStock,
} from '@/utils';
import { INVOICE_TYPE_LABELS, UNIT_LIST } from '@/types';
import type { Invoice, InvoiceLine, InvoiceType, Unit, GlobalDiscountType, Contact, Product } from '@/types';
import { Modal } from '@/components/Modal';
import { JalaliDatePicker } from '@/components/JalaliDatePicker';
import { ProductPicker } from '@/components/ProductPicker';

export function InvoiceEditor({
  editId, type, onClose,
}: {
  editId: string | null;
  type: InvoiceType;
  onClose: () => void;
}) {
  const { data, addInvoice, updateInvoice, addContact, convertProformaToSale } = useStore();
  const existing = editId ? data.invoices.find(i => i.id === editId) : null;

  const [invoiceType, setInvoiceType] = useState<InvoiceType>(existing?.type ?? type);
  const [contactId, setContactId] = useState(existing?.contactId ?? '');
  const [date, setDate] = useState(existing?.date ?? Date.now());
  const [lines, setLines] = useState<InvoiceLine[]>(existing?.lines ?? []);
  const [globalDiscountType, setGlobalDiscountType] = useState<GlobalDiscountType>(existing?.globalDiscountType ?? 'percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(String(existing?.globalDiscountValue ?? 0));
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const [showNewContact, setShowNewContact] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerTargetLineId, setPickerTargetLineId] = useState<string | null>(null);

  const nextNumber = useMemo(() => {
    const prefix: Record<InvoiceType, string> = {
      sale: 'S', purchase: 'P', return: 'R', proforma: 'PR',
    };
    const count = data.invoices.filter(i => i.type === invoiceType).length + 1;
    return `${prefix[invoiceType]}-${String(count).padStart(5, '0')}`;
  }, [data.invoices, invoiceType]);

  const number = existing?.number ?? nextNumber;

  const addLine = (product?: Product) => {
    const line: InvoiceLine = {
      id: uid(),
      productId: product?.id ?? '',
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      unit: product?.unit ?? 'عدد',
      qty: 1,
      unitPrice: product ? (invoiceType === 'purchase' ? product.purchasePrice : product.salePrice) : 0,
      discountPct: 0,
      vatPct: 0,
    };
    setLines(prev => [...prev, line]);
  };

  const updateLine = (id: string, patch: Partial<InvoiceLine>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const onProductSelect = (product: Product) => {
    if (pickerTargetLineId) {
      updateLine(pickerTargetLineId, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        unitPrice: invoiceType === 'purchase' ? product.purchasePrice : product.salePrice,
      });
    } else {
      addLine(product);
    }
    setPickerTargetLineId(null);
  };

  const handleSave = () => {
    if (!contactId) {
      alert('لطفاً شخص را انتخاب کنید.');
      return;
    }
    if (lines.length === 0) {
      alert('حداقل یک ردیف کالا اضافه کنید.');
      return;
    }
    const payload: Omit<Invoice, 'id' | 'createdAt'> = {
      number,
      type: invoiceType,
      contactId,
      date,
      lines,
      globalDiscountType,
      globalDiscountValue: parseFloat(globalDiscountValue) || 0,
      notes,
      paid: existing?.paid ?? false,
      paymentLocked: existing?.paymentLocked ?? false,
    };
    if (existing) {
      updateInvoice(existing.id, payload);
    } else {
      addInvoice(payload);
    }
    onClose();
  };

  const handleConvertToSale = () => {
    if (!existing || existing.type !== 'proforma') return;
    convertProformaToSale(existing.id);
    setShowConvert(false);
    onClose();
  };

  const subtotal = invoiceSubtotal(lines);
  const lineDiscount = invoiceLineDiscount(lines);
  const vat = invoiceVat(lines);
  const globalDisc = invoiceGlobalDiscount(lines, {
    globalDiscountType, globalDiscountValue: parseFloat(globalDiscountValue) || 0,
    lines: [], id: '', number: '', type: invoiceType, contactId: '',
    date: 0, notes: '', paid: false, paymentLocked: false, createdAt: 0,
  } as Invoice);
  const total = invoiceTotal(lines, {
    globalDiscountType, globalDiscountValue: parseFloat(globalDiscountValue) || 0,
    lines: [], id: '', number: '', type: invoiceType, contactId: '',
    date: 0, notes: '', paid: false, paymentLocked: false, createdAt: 0,
  } as Invoice);

  const contactOptions = data.contacts.filter(c =>
    invoiceType === 'purchase' ? c.type === 'supplier' : c.type === 'customer'
  );

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl mx-auto no-print">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost !p-2" onClick={onClose}>
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{INVOICE_TYPE_LABELS[invoiceType]}</h1>
            <p className="text-xs text-slate-500 font-mono">{number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {existing?.type === 'proforma' && (
            <button className="btn btn-secondary" onClick={() => setShowConvert(true)}>
              <FileText size={16} /> تبدیل به فاکتور فروش
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> ذخیره
          </button>
        </div>
      </div>

      {/* Top fields */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">نوع سند</label>
            <select
              className="input w-full"
              value={invoiceType}
              onChange={e => setInvoiceType(e.target.value as InvoiceType)}
              disabled={!!existing}
            >
              {(['sale', 'purchase', 'proforma', 'return'] as InvoiceType[]).map(t => (
                <option key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">شخص</label>
            <div className="flex gap-2">
              <select className="input w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
                <option value="">— انتخاب —</option>
                {contactOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <button
                className="btn btn-secondary !px-3 whitespace-nowrap"
                onClick={() => setShowNewContact(true)}
                title="مشتری جدید"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="label">تاریخ</label>
            <JalaliDatePicker value={date} onChange={setDate} className="w-full" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">ردیف‌های کالا</h2>
          <button
            className="btn btn-secondary !py-1.5 !text-xs"
            onClick={() => { setPickerTargetLineId(null); setShowProductPicker(true); }}
          >
            <Plus size={14} /> افزودن ردیف
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="th w-8">#</th>
                <th className="th">کالا</th>
                <th className="th w-20">واحد</th>
                <th className="th w-24">تعداد</th>
                <th className="th w-32">قیمت واحد</th>
                <th className="th w-20">تخفیف٪</th>
                <th className="th w-20">مالیات٪</th>
                <th className="th w-32">مبلغ کل</th>
                <th className="th w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="td text-center text-slate-500 py-6">
                    ردیفی اضافه نشده. روی «افزودن ردیف» بزنید.
                  </td>
                </tr>
              ) : lines.map((l, idx) => {
                const stock = l.productId ? effectiveStock(l.productId, data.products.find(p => p.id === l.productId)?.stock ?? 0, data.invoices) : 0;
                return (
                  <tr key={l.id} className="hover:bg-slate-700/10">
                    <td className="td text-center text-slate-500 text-xs">{idx + 1}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {l.productId ? (
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-100">{l.name}</p>
                            <p className="text-xs text-slate-500">کد: {l.sku} — موجودی: {formatRial(stock)} {l.unit}</p>
                          </div>
                        ) : (
                          <input
                            className="input !py-1.5 w-full"
                            placeholder="نام کالا را وارد کنید..."
                            value={l.name}
                            onChange={e => updateLine(l.id, { name: e.target.value })}
                          />
                        )}
                        <button
                          className="btn btn-ghost !p-1.5 shrink-0"
                          onClick={() => { setPickerTargetLineId(l.id); setShowProductPicker(true); }}
                          title="انتخاب کالا"
                        >
                          <Package size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="td">
                      <select
                        className="input !py-1.5 w-full !text-xs"
                        value={l.unit}
                        onChange={e => updateLine(l.id, { unit: e.target.value as Unit })}
                      >
                        {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="td">
                      <input
                        className="input !py-1.5 w-full text-left"
                        type="number"
                        value={l.qty}
                        onChange={e => updateLine(l.id, { qty: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="td">
                      <input
                        className="input !py-1.5 w-full text-left"
                        type="number"
                        value={l.unitPrice}
                        onChange={e => updateLine(l.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="td">
                      <input
                        className="input !py-1.5 w-full text-left"
                        type="number"
                        value={l.discountPct}
                        onChange={e => updateLine(l.id, { discountPct: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="td">
                      <input
                        className="input !py-1.5 w-full text-left"
                        type="number"
                        value={l.vatPct}
                        onChange={e => updateLine(l.id, { vatPct: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="td text-left font-bold text-emerald-400 whitespace-nowrap">
                      {formatRial(lineNet(l))} ریال
                    </td>
                    <td className="td">
                      <button className="btn btn-ghost !p-1 hover:!text-red-400" onClick={() => removeLine(l.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: Global discount + Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <label className="label">تخفیف کل فاکتور</label>
          <div className="flex gap-2">
            <select
              className="input w-auto"
              value={globalDiscountType}
              onChange={e => setGlobalDiscountType(e.target.value as GlobalDiscountType)}
            >
              <option value="percent">درصد</option>
              <option value="amount">مبلغ (ریال)</option>
            </select>
            <input
              className="input flex-1 text-left"
              type="number"
              value={globalDiscountValue}
              onChange={e => setGlobalDiscountValue(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <label className="label">توضیحات</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="یادداشت اختیاری..."
            />
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">جمع کل (بدون تخفیف و مالیات)</span>
            <span className="text-slate-200">{formatRial(subtotal)} ریال</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">تخفیف ردیف‌ها</span>
            <span className="text-red-400">- {formatRial(lineDiscount)} ریال</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">مالیات بر ارزش افزوده</span>
            <span className="text-amber-400">+ {formatRial(vat)} ریال</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">تخفیف کل فاکتور</span>
            <span className="text-red-400">- {formatRial(globalDisc)} ریال</span>
          </div>
          <div className="border-t border-slate-700/50 pt-2 flex justify-between">
            <span className="font-bold text-slate-200">مبلغ نهایی</span>
            <span className="font-bold text-lg text-emerald-400">{formatRial(total)} ریال</span>
          </div>
        </div>
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <NewContactModal
          type={invoiceType === 'purchase' ? 'supplier' : 'customer'}
          onClose={() => setShowNewContact(false)}
          onAdd={(c) => {
            const contact = addContact(c);
            setContactId(contact.id);
            setShowNewContact(false);
          }}
          nextCode={String(data.counters.contact + 1).padStart(4, '0')}
        />
      )}

      {/* Product Picker Modal */}
      <ProductPicker
        open={showProductPicker}
        onClose={() => { setShowProductPicker(false); setPickerTargetLineId(null); }}
        onSelect={onProductSelect}
      />

      {/* Convert confirm */}
      {showConvert && (
        <Modal open onClose={() => setShowConvert(false)} title="تبدیل به فاکتور فروش" size="sm">
          <p className="text-sm text-slate-400 mb-4">
            یک فاکتور فروش جدید با همین ردیف‌ها ایجاد می‌شود و موجودی کالاها کسر می‌گردد. این پیش‌فاکتور پس از تبدیل حذف خواهد شد.
          </p>
          <div className="flex gap-3 justify-end">
            <button className="btn btn-secondary" onClick={() => setShowConvert(false)}>انصراف</button>
            <button className="btn btn-primary" onClick={handleConvertToSale}>
              <FileText size={16} /> تبدیل
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NewContactModal({
  type, onClose, onAdd, nextCode,
}: {
  type: 'customer' | 'supplier';
  onClose: () => void;
  onAdd: (c: Omit<Contact, 'id' | 'createdAt'>) => void;
  nextCode: string;
}) {
  const [code, setCode] = useState(nextCode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <Modal open onClose={onClose} title={type === 'customer' ? 'مشتری جدید' : 'تأمین‌کننده جدید'} size="sm">
      <div className="space-y-3">
        <div>
          <label className="label">کد</label>
          <input className="input w-full" value={code} onChange={e => setCode(e.target.value)} />
        </div>
        <div>
          <label className="label">نام *</label>
          <input className="input w-full" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">تلفن</label>
          <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim()) return;
              onAdd({
                code: code.trim() || nextCode,
                name: name.trim(),
                type,
                phone: phone.trim(),
                nationalId: '',
                address: '',
                openingBalance: 0,
              });
            }}
          >
            <Plus size={16} /> افزودن
          </button>
        </div>
      </div>
    </Modal>
  );
}
