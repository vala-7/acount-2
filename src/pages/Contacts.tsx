import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Save, Users, BookOpen, Phone,
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatRial, formatDate, contactTotalBalance, invoiceTotal,
} from '@/utils';
import { INVOICE_TYPE_LABELS } from '@/types';
import type { Contact, ContactType } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';

export function Contacts() {
  const { data, addContact, updateContact, deleteContact } = useStore();
  const [tab, setTab] = useState<ContactType>('customer');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.contacts.filter(c => {
      if (c.type !== tab) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);
    });
  }, [data.contacts, tab, search]);

  const nextCode = String(
    (tab === 'customer'
      ? data.counters.contact
      : data.counters.contact) + 1
  ).padStart(4, '0');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">مدیریت اشخاص</h1>
          <p className="text-sm text-slate-400 mt-1">مشتریان و تأمین‌کنندگان</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> {tab === 'customer' ? 'مشتری جدید' : 'تأمین‌کننده جدید'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`btn ${tab === 'customer' ? 'tab-active' : 'tab-inactive bg-slate-800'}`}
          onClick={() => setTab('customer')}
        >
          <Users size={16} /> مشتریان
        </button>
        <button
          className={`btn ${tab === 'supplier' ? 'tab-active' : 'tab-inactive bg-slate-800'}`}
          onClick={() => setTab('supplier')}
        >
          <Users size={16} /> تأمین‌کنندگان
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input w-full !pr-10"
          placeholder="جستجو بر اساس نام، کد یا تلفن..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Contacts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="th">کد</th>
                <th className="th">نام</th>
                <th className="th">تلفن</th>
                <th className="th">مانده حساب</th>
                <th className="th">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td text-center text-slate-500 py-8">
                    شخصی یافت نشد.
                  </td>
                </tr>
              ) : filtered.map(c => {
                const balance = contactTotalBalance(c, data.invoices, data.payments);
                return (
                  <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="td font-mono text-xs text-slate-400">{c.code}</td>
                    <td className="td font-medium text-slate-100">{c.name}</td>
                    <td className="td text-slate-400">{c.phone || '—'}</td>
                    <td className="td">
                      <span className={`font-bold ${balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {formatRial(Math.abs(balance))} ریال
                      </span>
                      <span className="text-xs text-slate-500 mr-1">
                        {balance > 0 ? '(بدهکار)' : balance < 0 ? '(طلبکار)' : '(تسویه)'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" onClick={() => setLedgerId(c.id)} title="گردش حساب">
                          <BookOpen size={16} />
                        </button>
                        <button className="btn btn-ghost !p-1.5" onClick={() => setEditingId(c.id)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-ghost !p-1.5 hover:!text-red-400" onClick={() => setDeleteId(c.id)}>
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

      {showAdd && (
        <ContactForm
          type={tab}
          onClose={() => setShowAdd(false)}
          onSave={(c) => {
            addContact(c);
            setShowAdd(false);
          }}
          nextCode={nextCode ?? ''}
        />
      )}
      {editingId && (
        <ContactForm
          type={tab}
          contact={data.contacts.find(c => c.id === editingId) ?? null}
          onClose={() => setEditingId(null)}
          onSave={(c) => {
            updateContact(editingId, c);
            setEditingId(null);
          }}
        />
      )}
      {ledgerId && (
        <LedgerModal
          contact={data.contacts.find(c => c.id === ledgerId)!}
          onClose={() => setLedgerId(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="حذف شخص"
        message="حذف این شخص، تمام فاکتورها و پرداخت‌های مرتبط را نیز پاک می‌کند. ادامه می‌دهید؟"
        onConfirm={() => {
          if (deleteId) deleteContact(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function ContactForm({
  contact, type, onClose, onSave, nextCode,
}: {
  contact?: Contact | null;
  type: ContactType;
  onClose: () => void;
  onSave: (c: Omit<Contact, 'id' | 'createdAt'>) => void;
  nextCode?: string;
}) {
  const [code, setCode] = useState(contact?.code ?? nextCode ?? '');
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [nationalId, setNationalId] = useState(contact?.nationalId ?? '');
  const [address, setAddress] = useState(contact?.address ?? '');
  const [openingBalance, setOpeningBalance] = useState(String(contact?.openingBalance ?? 0));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      code: code.trim() || (nextCode ?? ''),
      name: name.trim(),
      type,
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      address: address.trim(),
      openingBalance: parseFloat(openingBalance) || 0,
    });
  };

  return (
    <Modal open onClose={onClose} title={contact ? 'ویرایش اطلاعات' : (type === 'customer' ? 'مشتری جدید' : 'تأمین‌کننده جدید')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">کد</label>
            <input className="input w-full" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div>
            <label className="label">تلفن</label>
            <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">نام *</label>
          <input className="input w-full" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">شناسه ملی</label>
            <input className="input w-full" value={nationalId} onChange={e => setNationalId(e.target.value)} />
          </div>
          <div>
            <label className="label">مانده اول دوره (ریال)</label>
            <input className="input w-full text-left" type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">آدرس</label>
          <textarea className="input w-full resize-none" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
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

function LedgerModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { data } = useStore();

  const entries = useMemo(() => {
    type Entry = { date: number; desc: string; debit: number; credit: number; ref: string };
    const list: Entry[] = [];

    // Opening balance
    if (contact.openingBalance !== 0) {
      list.push({
        date: contact.createdAt,
        desc: 'مانده اول دوره',
        debit: contact.openingBalance > 0 ? contact.openingBalance : 0,
        credit: contact.openingBalance < 0 ? -contact.openingBalance : 0,
        ref: '—',
      });
    }

    for (const inv of data.invoices) {
      if (inv.contactId !== contact.id) continue;
      const total = invoiceTotal(inv.lines, inv);
      if (inv.type === 'sale' || inv.type === 'proforma') {
        list.push({ date: inv.date, desc: INVOICE_TYPE_LABELS[inv.type] + ' - ' + inv.number, debit: total, credit: 0, ref: inv.number });
      } else if (inv.type === 'purchase') {
        list.push({ date: inv.date, desc: INVOICE_TYPE_LABELS[inv.type] + ' - ' + inv.number, debit: 0, credit: total, ref: inv.number });
      } else if (inv.type === 'return') {
        list.push({ date: inv.date, desc: INVOICE_TYPE_LABELS[inv.type] + ' - ' + inv.number, debit: 0, credit: total, ref: inv.number });
      }
    }

    for (const p of data.payments) {
      if (p.contactId !== contact.id) continue;
      list.push({ date: p.date, desc: 'دریافت/پرداخت' + (p.note ? ' - ' + p.note : ''), debit: 0, credit: p.amount, ref: p.id });
    }

    list.sort((a, b) => a.date - b.date);

    let running = 0;
    return list.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });
  }, [contact, data.invoices, data.payments]);

  const totalBalance = contactTotalBalance(contact, data.invoices, data.payments);

  return (
    <Modal open onClose={onClose} title={`گردش حساب — ${contact.name}`} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3">
            <p className="text-xs text-slate-400">مانده اول دوره</p>
            <p className="text-sm font-bold text-slate-100">{formatRial(contact.openingBalance)} ریال</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">گردش بدهکار</p>
            <p className="text-sm font-bold text-emerald-400">{formatRial(entries.reduce((s, e) => s + e.debit, 0))} ریال</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">گردش بستانکار</p>
            <p className="text-sm font-bold text-red-400">{formatRial(entries.reduce((s, e) => s + e.credit, 0))} ریال</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-900/40 sticky top-0">
                <tr>
                  <th className="th">تاریخ</th>
                  <th className="th">شرح</th>
                  <th className="th">بدهکار</th>
                  <th className="th">بستانکار</th>
                  <th className="th">مانده</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="td text-center text-slate-500 py-6">گردشی ثبت نشده است.</td>
                  </tr>
                ) : entries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="td text-xs text-slate-400">{formatDate(e.date)}</td>
                    <td className="td text-slate-200">{e.desc}</td>
                    <td className="td text-left text-emerald-400">{e.debit ? formatRial(e.debit) : '—'}</td>
                    <td className="td text-left text-red-400">{e.credit ? formatRial(e.credit) : '—'}</td>
                    <td className="td text-left font-bold text-slate-200">{formatRial((e as any).balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/60 font-bold">
                  <td className="td" colSpan={4}>مانده نهایی</td>
                  <td className="td text-left">
                    <span className={totalBalance > 0 ? 'text-emerald-400' : totalBalance < 0 ? 'text-red-400' : 'text-slate-300'}>
                      {formatRial(Math.abs(totalBalance))} ریال
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
