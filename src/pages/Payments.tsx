import { useState, useMemo } from 'react';
import {
  Plus, Search, Trash2, Printer, Wallet, Landmark, FileCheck,
  Banknote, Edit3, Building2,
} from 'lucide-react';
import { useStore } from '@/store';
import { formatRial, formatDate, contactTotalBalance } from '@/utils';
import { PAYMENT_METHOD_LABELS, CHEQUE_STATUS_LABELS } from '@/types';
import type { Payment, PaymentMethod, PaymentDirection, Cheque, ChequeStatus, BankAccount } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { JalaliDatePicker } from '@/components/JalaliDatePicker';
import { PaymentReceipt } from '@/pages/PaymentReceipt';

type Tab = 'transactions' | 'bank' | 'cheques';

export function Payments() {
  const { data, addPayment, deletePayment, addCheque, updateCheque, deleteCheque, addBankAccount, updateBankAccount, deleteBankAccount } = useStore();
  const [tab, setTab] = useState<Tab>('transactions');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'payment' | 'cheque' | 'bank'>('payment');
  const [printPayment, setPrintPayment] = useState<Payment | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [showChequeForm, setShowChequeForm] = useState(false);
  const [editingChequeId, setEditingChequeId] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data.payments]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter(p => {
        if (!q) return true;
        const contact = data.contacts.find(c => c.id === p.contactId);
        return (contact?.name.toLowerCase().includes(q) ?? false) ||
          p.note.toLowerCase().includes(q);
      });
  }, [data.payments, data.contacts, search]);

  const filteredCheques = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data.cheques]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter(c => {
        if (!q) return true;
        const contact = data.contacts.find(co => co.id === c.contactId);
        return (contact?.name.toLowerCase().includes(q) ?? false) ||
          c.number.toLowerCase().includes(q) ||
          c.bankName.toLowerCase().includes(q);
      });
  }, [data.cheques, data.contacts, search]);

  if (printPayment) {
    return <PaymentReceipt payment={printPayment} onBack={() => setPrintPayment(null)} />;
  }

  const methodIcons: Record<PaymentMethod, typeof Wallet> = {
    cash: Banknote,
    bank: Landmark,
    cheque: FileCheck,
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">دریافت و پرداخت</h1>
          <p className="text-sm text-slate-400 mt-1">مدیریت صندوق، بانک، پوز و چک‌ها</p>
        </div>
        {tab === 'transactions' && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> ثبت دریافت/پرداخت
          </button>
        )}
        {tab === 'bank' && (
          <button className="btn btn-primary" onClick={() => { setEditingBankId(null); setShowBankForm(true); }}>
            <Plus size={16} /> حساب بانکی جدید
          </button>
        )}
        {tab === 'cheques' && (
          <button className="btn btn-primary" onClick={() => { setEditingChequeId(null); setShowChequeForm(true); }}>
            <Plus size={16} /> ثبت چک
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={`btn ${tab === 'transactions' ? 'tab-active' : 'tab-inactive bg-slate-800'}`}
          onClick={() => setTab('transactions')}
        >
          <Wallet size={16} /> تراکنش‌ها
        </button>
        <button
          className={`btn ${tab === 'bank' ? 'tab-active' : 'tab-inactive bg-slate-800'}`}
          onClick={() => setTab('bank')}
        >
          <Landmark size={16} /> حساب‌های بانکی
        </button>
        <button
          className={`btn ${tab === 'cheques' ? 'tab-active' : 'tab-inactive bg-slate-800'}`}
          onClick={() => setTab('cheques')}
        >
          <FileCheck size={16} /> چک‌ها
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input w-full !pr-10"
          placeholder={tab === 'cheques' ? 'جستجو بر اساس نام، شماره چک یا بانک...' : 'جستجو بر اساس نام یا توضیح...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-900/40">
                <tr>
                  <th className="th">تاریخ</th>
                  <th className="th">شخص</th>
                  <th className="th">نوع</th>
                  <th className="th">روش</th>
                  <th className="th">مبلغ</th>
                  <th className="th">توضیح</th>
                  <th className="th">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="td text-center text-slate-500 py-8">
                      تراکنشی ثبت نشده است.
                    </td>
                  </tr>
                ) : filteredPayments.map(p => {
                  const contact = data.contacts.find(c => c.id === p.contactId);
                  const Icon = methodIcons[p.method];
                  return (
                    <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="td text-xs text-slate-400">{formatDate(p.date)}</td>
                      <td className="td font-medium text-slate-100">{contact?.name ?? '—'}</td>
                      <td className="td">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          p.direction === 'receipt' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {p.direction === 'receipt' ? 'دریافت' : 'پرداخت'}
                        </span>
                      </td>
                      <td className="td">
                        <span className="flex items-center gap-1.5 text-sm text-slate-300">
                          <Icon size={14} />
                          {PAYMENT_METHOD_LABELS[p.method]}
                        </span>
                      </td>
                      <td className="td">
                        <span className={`font-bold ${p.direction === 'receipt' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatRial(p.amount)} ریال
                        </span>
                      </td>
                      <td className="td text-slate-400 text-xs">{p.note || '—'}</td>
                      <td className="td">
                        <div className="flex gap-1">
                          <button className="btn btn-ghost !p-1.5" onClick={() => setPrintPayment(p)} title="چاپ رسید">
                            <Printer size={16} />
                          </button>
                          <button className="btn btn-ghost !p-1.5 hover:!text-red-400" onClick={() => { setDeleteId(p.id); setDeleteType('payment'); }} title="حذف">
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
      )}

      {/* Bank Accounts Tab */}
      {tab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.bankAccounts.length === 0 ? (
            <div className="col-span-full card p-8 text-center text-slate-500">
              حساب بانکی ثبت نشده است. روی «حساب بانکی جدید» بزنید.
            </div>
          ) : data.bankAccounts.map(b => (
            <div key={b.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.bankName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost !p-1.5" onClick={() => { setEditingBankId(b.id); setShowBankForm(true); }}>
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost !p-1.5 hover:!text-red-400" onClick={() => { setDeleteId(b.id); setDeleteType('bank'); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {b.accountNumber && <p>شماره حساب: <span className="font-mono text-slate-300">{b.accountNumber}</span></p>}
                {b.cardNumber && <p>شماره کارت: <span className="font-mono text-slate-300">{b.cardNumber}</span></p>}
                {b.posTerminal && <p>کد پوز: <span className="font-mono text-slate-300">{b.posTerminal}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cheques Tab */}
      {tab === 'cheques' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-900/40">
                <tr>
                  <th className="th">شماره چک</th>
                  <th className="th">نوع</th>
                  <th className="th">شخص</th>
                  <th className="th">بانک</th>
                  <th className="th">مبلغ</th>
                  <th className="th">تاریخ صدور</th>
                  <th className="th">تاریخ وصول</th>
                  <th className="th">وضعیت</th>
                  <th className="th">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="td text-center text-slate-500 py-8">
                      چکی ثبت نشده است.
                    </td>
                  </tr>
                ) : filteredCheques.map(c => {
                  const contact = data.contacts.find(co => co.id === c.contactId);
                  const statusColors: Record<ChequeStatus, string> = {
                    pending: 'bg-amber-500/20 text-amber-400',
                    cleared: 'bg-emerald-500/20 text-emerald-400',
                    bounced: 'bg-red-500/20 text-red-400',
                    cancelled: 'bg-slate-500/20 text-slate-400',
                  };
                  return (
                    <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="td font-mono text-xs">{c.number}</td>
                      <td className="td">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.direction === 'receipt' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {c.direction === 'receipt' ? 'دریافتی' : 'پرداختی'}
                        </span>
                      </td>
                      <td className="td text-slate-200">{contact?.name ?? '—'}</td>
                      <td className="td text-slate-400 text-xs">{c.bankName}</td>
                      <td className="td font-bold text-emerald-400">{formatRial(c.amount)} ریال</td>
                      <td className="td text-xs text-slate-400">{formatDate(c.issueDate)}</td>
                      <td className="td text-xs text-slate-400">{formatDate(c.dueDate)}</td>
                      <td className="td">
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status]}`}>
                          {CHEQUE_STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="td">
                        <div className="flex gap-1">
                          {c.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-ghost !p-1.5 hover:!text-emerald-400"
                                onClick={() => updateCheque(c.id, { status: 'cleared' })}
                                title="وصول شد"
                              >
                                <FileCheck size={16} />
                              </button>
                              <button
                                className="btn btn-ghost !p-1.5 hover:!text-red-400"
                                onClick={() => updateCheque(c.id, { status: 'bounced' })}
                                title="برگشت خورد"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-ghost !p-1.5 hover:!text-red-400"
                            onClick={() => { setDeleteId(c.id); setDeleteType('cheque'); }}
                            title="حذف"
                          >
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
      )}

      {/* Add Payment Modal */}
      {showAdd && (
        <PaymentForm
          onClose={() => setShowAdd(false)}
          onSave={(p) => {
            addPayment(p);
            setShowAdd(false);
          }}
        />
      )}

      {/* Bank Account Form */}
      {showBankForm && (
        <BankAccountForm
          bankAccount={editingBankId ? data.bankAccounts.find(b => b.id === editingBankId) ?? null : null}
          onClose={() => setShowBankForm(false)}
          onSave={(b) => {
            if (editingBankId) {
              updateBankAccount(editingBankId, b);
            } else {
              addBankAccount(b);
            }
            setShowBankForm(false);
          }}
        />
      )}

      {/* Cheque Form */}
      {showChequeForm && (
        <ChequeForm
          cheque={editingChequeId ? data.cheques.find(c => c.id === editingChequeId) ?? null : null}
          onClose={() => setShowChequeForm(false)}
          onSave={(c) => {
            if (editingChequeId) {
              updateCheque(editingChequeId, c);
            } else {
              addCheque(c);
            }
            setShowChequeForm(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={deleteType === 'bank' ? 'حذف حساب بانکی' : deleteType === 'cheque' ? 'حذف چک' : 'حذف تراکنش'}
        message="آیا از حذف این مورد مطمئن هستید؟"
        onConfirm={() => {
          if (deleteId) {
            if (deleteType === 'payment') deletePayment(deleteId);
            else if (deleteType === 'cheque') deleteCheque(deleteId);
            else deleteBankAccount(deleteId);
          }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function PaymentForm({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (p: Omit<Payment, 'id' | 'createdAt'>) => void;
}) {
  const { data } = useStore();
  const [direction, setDirection] = useState<PaymentDirection>('receipt');
  const [contactId, setContactId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(Date.now());
  const [bankAccountId, setBankAccountId] = useState('');
  const [note, setNote] = useState('');

  const contactOptions = data.contacts;

  const handleSave = () => {
    if (!contactId || !amount) return;
    onSave({
      contactId,
      direction,
      amount: parseFloat(amount) || 0,
      date,
      method,
      note: note.trim(),
      bankAccountId: method === 'bank' ? bankAccountId : undefined,
    });
  };

  return (
    <Modal open onClose={onClose} title="ثبت دریافت / پرداخت">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`btn justify-center ${direction === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDirection('receipt')}
          >
            <Wallet size={16} /> دریافت
          </button>
          <button
            className={`btn justify-center ${direction === 'payment' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setDirection('payment')}
          >
            <Wallet size={16} /> پرداخت
          </button>
        </div>

        <div>
          <label className="label">شخص *</label>
          <select className="input w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">— انتخاب —</option>
            {contactOptions.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {contactId && (
          <div className="card p-3 text-sm">
            <span className="text-slate-400">مانده حساب: </span>
            {(() => {
              const contact = data.contacts.find(c => c.id === contactId)!;
              const bal = contactTotalBalance(contact, data.invoices, data.payments);
              return (
                <span className={`font-bold ${bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  {formatRial(Math.abs(bal))} ریال {bal > 0 ? '(بدهکار)' : bal < 0 ? '(طلبکار)' : '(تسویه)'}
                </span>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">روش دریافت/پرداخت</label>
            <select className="input w-full" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
              <option value="cash">صندوق</option>
              <option value="bank">بانک / پوز</option>
              <option value="cheque">چک</option>
            </select>
          </div>
          <div>
            <label className="label">مبلغ (ریال) *</label>
            <input className="input w-full text-left" type="number" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
          </div>
        </div>

        {method === 'bank' && (
          <div>
            <label className="label">حساب بانکی</label>
            <select className="input w-full" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}>
              <option value="">— انتخاب حساب —</option>
              {data.bankAccounts.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.bankName}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">تاریخ</label>
          <JalaliDatePicker value={date} onChange={setDate} className="w-full" />
        </div>

        <div>
          <label className="label">توضیح</label>
          <input className="input w-full" value={note} onChange={e => setNote(e.target.value)} placeholder="یادداشت اختیاری..." />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Plus size={16} /> ثبت
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BankAccountForm({
  bankAccount, onClose, onSave,
}: {
  bankAccount: BankAccount | null;
  onClose: () => void;
  onSave: (b: Omit<BankAccount, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState(bankAccount?.name ?? '');
  const [bankName, setBankName] = useState(bankAccount?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(bankAccount?.accountNumber ?? '');
  const [cardNumber, setCardNumber] = useState(bankAccount?.cardNumber ?? '');
  const [posTerminal, setPosTerminal] = useState(bankAccount?.posTerminal ?? '');

  const handleSave = () => {
    if (!name.trim() || !bankName.trim()) return;
    onSave({
      name: name.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      cardNumber: cardNumber.trim(),
      posTerminal: posTerminal.trim(),
    });
  };

  return (
    <Modal open onClose={onClose} title={bankAccount ? 'ویرایش حساب بانکی' : 'حساب بانکی جدید'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">نام حساب *</label>
            <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً: جاری ملت" autoFocus />
          </div>
          <div>
            <label className="label">نام بانک *</label>
            <input className="input w-full" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="مثلاً: بانک ملت" />
          </div>
        </div>
        <div>
          <label className="label">شماره حساب</label>
          <input className="input w-full font-mono text-left" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">شماره کارت</label>
            <input className="input w-full font-mono text-left" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
          </div>
          <div>
            <label className="label">کد پوز</label>
            <input className="input w-full font-mono text-left" value={posTerminal} onChange={e => setPosTerminal(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
          <button className="btn btn-primary" onClick={handleSave}>ذخیره</button>
        </div>
      </div>
    </Modal>
  );
}

function ChequeForm({
  cheque, onClose, onSave,
}: {
  cheque: Cheque | null;
  onClose: () => void;
  onSave: (c: Omit<Cheque, 'id' | 'createdAt'>) => void;
}) {
  const { data } = useStore();
  const [direction, setDirection] = useState<PaymentDirection>(cheque?.direction ?? 'receipt');
  const [contactId, setContactId] = useState(cheque?.contactId ?? '');
  const [number, setNumber] = useState(cheque?.number ?? '');
  const [amount, setAmount] = useState(String(cheque?.amount ?? ''));
  const [bankName, setBankName] = useState(cheque?.bankName ?? '');
  const [issueDate, setIssueDate] = useState(cheque?.issueDate ?? Date.now());
  const [dueDate, setDueDate] = useState(cheque?.dueDate ?? Date.now());
  const [status, setStatus] = useState<ChequeStatus>(cheque?.status ?? 'pending');
  const [note, setNote] = useState(cheque?.note ?? '');

  const handleSave = () => {
    if (!contactId || !number.trim() || !amount) return;
    onSave({
      direction,
      contactId,
      number: number.trim(),
      amount: parseFloat(amount) || 0,
      bankName: bankName.trim(),
      issueDate,
      dueDate,
      status,
      note: note.trim(),
    });
  };

  return (
    <Modal open onClose={onClose} title={cheque ? 'ویرایش چک' : 'ثبت چک'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`btn justify-center ${direction === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDirection('receipt')}
          >
            چک دریافتی
          </button>
          <button
            className={`btn justify-center ${direction === 'payment' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setDirection('payment')}
          >
            چک پرداختی
          </button>
        </div>

        <div>
          <label className="label">شخص *</label>
          <select className="input w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">— انتخاب —</option>
            {data.contacts.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">شماره چک *</label>
            <input className="input w-full font-mono text-left" value={number} onChange={e => setNumber(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">مبلغ (ریال) *</label>
            <input className="input w-full text-left" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">بانک</label>
          <input className="input w-full" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="نام بانک صادرکننده" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">تاریخ صدور</label>
            <JalaliDatePicker value={issueDate} onChange={setIssueDate} className="w-full" />
          </div>
          <div>
            <label className="label">تاریخ وصول</label>
            <JalaliDatePicker value={dueDate} onChange={setDueDate} className="w-full" />
          </div>
        </div>

        <div>
          <label className="label">وضعیت</label>
          <select className="input w-full" value={status} onChange={e => setStatus(e.target.value as ChequeStatus)}>
            <option value="pending">در جریان</option>
            <option value="cleared">وصول‌شده</option>
            <option value="bounced">برگشت‌خورده</option>
            <option value="cancelled">باطل‌شده</option>
          </select>
        </div>

        <div>
          <label className="label">توضیح</label>
          <input className="input w-full" value={note} onChange={e => setNote(e.target.value)} placeholder="یادداشت اختیاری..." />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-secondary" onClick={onClose}>انصراف</button>
          <button className="btn btn-primary" onClick={handleSave}>ذخیره</button>
        </div>
      </div>
    </Modal>
  );
}
