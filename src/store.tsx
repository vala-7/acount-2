import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  AppData, Contact, Product, Invoice, Payment, AppSettings, PrintSettings,
  BankAccount, Cheque,
} from '@/types';
import { DEFAULT_SETTINGS, emptyData } from '@/types';
import { uid } from '@/utils';

const STORAGE_KEY = 'store-accounting-v2';
const PIN_KEY = 'app-pin-v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
    if (!parsed.settings.print) parsed.settings.print = DEFAULT_SETTINGS.print;
    if (!parsed.settings.pin) parsed.settings.pin = localStorage.getItem(PIN_KEY) || DEFAULT_SETTINGS.pin;
    if (!parsed.counters) parsed.counters = { contact: 0, product: 0, invoice: 0 };
    if (!parsed.bankAccounts) parsed.bankAccounts = [];
    if (!parsed.cheques) parsed.cheques = [];
    if (!parsed.payments) parsed.payments = [];
    // Migrate old payments: set direction + method defaults
    parsed.payments = parsed.payments.map(p => ({
      ...p,
      direction: p.direction ?? (p.amount > 0 ? 'receipt' : 'payment'),
      method: p.method ?? 'cash',
      amount: Math.abs(p.amount),
    }));
    // Migrate old products: add category
    parsed.products = parsed.products.map(p => ({
      ...p,
      category: p.category ?? '',
    }));
    return parsed;
  } catch {
    return seedData();
  }
}

function seedData(): AppData {
  const d = emptyData();
  d.settings.storeName = 'فروشگاه نمونه';
  d.settings.storePhone = '021-12345678';
  d.settings.storeAddress = 'تهران، خیابان ولیعصر، پلاک ۱۰';
  d.settings.storeNationalId = '14001234567';
  d.settings.logoText = 'فروشگاه نمونه';
  d.settings.pin = '123456';
  return d;
}

interface StoreContextValue {
  data: AppData;
  setData: (d: AppData) => void;
  save: (d: AppData) => void;
  // Contacts
  addContact: (c: Omit<Contact, 'id' | 'createdAt'>) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  // Products
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Invoices
  addInvoice: (i: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  convertProformaToSale: (proformaId: string) => void;
  // Payments
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  deletePayment: (id: string) => void;
  // Bank Accounts
  addBankAccount: (b: Omit<BankAccount, 'id' | 'createdAt'>) => BankAccount;
  updateBankAccount: (id: string, patch: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  // Cheques
  addCheque: (c: Omit<Cheque, 'id' | 'createdAt'>) => Cheque;
  updateCheque: (id: string, patch: Partial<Cheque>) => void;
  deleteCheque: (id: string) => void;
  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  updatePrintSettings: (patch: Partial<PrintSettings>) => void;
  // PIN
  verifyPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
  // Backup
  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(load);

  const save = useCallback((d: AppData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
      // ignore quota errors
    }
  }, []);

  const setData = useCallback((d: AppData) => {
    setDataState(d);
    save(d);
  }, [save]);

  // auto-save on every change
  useEffect(() => {
    save(data);
  }, [data, save]);

  // --- Contacts ---
  const addContact = useCallback((c: Omit<Contact, 'id' | 'createdAt'>): Contact => {
    const contact: Contact = { ...c, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = {
        ...prev,
        contacts: [...prev.contacts, contact],
        counters: { ...prev.counters, contact: prev.counters.contact + 1 },
      };
      save(next);
      return next;
    });
    return contact;
  }, [save]);

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        contacts: prev.contacts.map(c => c.id === id ? { ...c, ...patch } : c),
      };
      save(next);
      return next;
    });
  }, [save]);

  const deleteContact = useCallback((id: string) => {
    setDataState(prev => {
      const next = {
        ...prev,
        contacts: prev.contacts.filter(c => c.id !== id),
        invoices: prev.invoices.filter(i => i.contactId !== id),
        payments: prev.payments.filter(p => p.contactId !== id),
        cheques: prev.cheques.filter(c => c.contactId !== id),
      };
      save(next);
      return next;
    });
  }, [save]);

  // --- Products ---
  const addProduct = useCallback((p: Omit<Product, 'id' | 'createdAt'>): Product => {
    const product: Product = { ...p, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = {
        ...prev,
        products: [...prev.products, product],
        counters: { ...prev.counters, product: prev.counters.product + 1 },
      };
      save(next);
      return next;
    });
    return product;
  }, [save]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        products: prev.products.map(p => p.id === id ? { ...p, ...patch } : p),
      };
      save(next);
      return next;
    });
  }, [save]);

  const deleteProduct = useCallback((id: string) => {
    setDataState(prev => {
      const next = { ...prev, products: prev.products.filter(p => p.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  // --- Invoices ---
  const addInvoice = useCallback((i: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
    const invoice: Invoice = { ...i, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = {
        ...prev,
        invoices: [...prev.invoices, invoice],
        counters: { ...prev.counters, invoice: prev.counters.invoice + 1 },
      };
      save(next);
      return next;
    });
    return invoice;
  }, [save]);

  const updateInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? { ...i, ...patch } : i),
      };
      save(next);
      return next;
    });
  }, [save]);

  const deleteInvoice = useCallback((id: string) => {
    setDataState(prev => {
      const inv = prev.invoices.find(i => i.id === id);
      if (inv && inv.paymentLocked) return prev;
      const next = { ...prev, invoices: prev.invoices.filter(i => i.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  const convertProformaToSale = useCallback((proformaId: string) => {
    setDataState(prev => {
      const proforma = prev.invoices.find(i => i.id === proformaId);
      if (!proforma || proforma.type !== 'proforma') return prev;
      const saleCount = prev.invoices.filter(i => i.type === 'sale').length + 1;
      const saleInvoice: Invoice = {
        ...proforma,
        id: uid(),
        number: `S-${String(saleCount).padStart(5, '0')}`,
        type: 'sale',
        date: Date.now(),
        createdAt: Date.now(),
        paid: false,
        paymentLocked: false,
      };
      const next = {
        ...prev,
        invoices: [...prev.invoices.filter(i => i.id !== proformaId), saleInvoice],
      };
      save(next);
      return next;
    });
  }, [save]);

  // --- Payments ---
  const addPayment = useCallback((p: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const payment: Payment = { ...p, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = { ...prev, payments: [...prev.payments, payment] };
      save(next);
      return next;
    });
    return payment;
  }, [save]);

  const deletePayment = useCallback((id: string) => {
    setDataState(prev => {
      const next = { ...prev, payments: prev.payments.filter(p => p.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  // --- Bank Accounts ---
  const addBankAccount = useCallback((b: Omit<BankAccount, 'id' | 'createdAt'>): BankAccount => {
    const account: BankAccount = { ...b, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = { ...prev, bankAccounts: [...prev.bankAccounts, account] };
      save(next);
      return next;
    });
    return account;
  }, [save]);

  const updateBankAccount = useCallback((id: string, patch: Partial<BankAccount>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        bankAccounts: prev.bankAccounts.map(b => b.id === id ? { ...b, ...patch } : b),
      };
      save(next);
      return next;
    });
  }, [save]);

  const deleteBankAccount = useCallback((id: string) => {
    setDataState(prev => {
      const next = { ...prev, bankAccounts: prev.bankAccounts.filter(b => b.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  // --- Cheques ---
  const addCheque = useCallback((c: Omit<Cheque, 'id' | 'createdAt'>): Cheque => {
    const cheque: Cheque = { ...c, id: uid(), createdAt: Date.now() };
    setDataState(prev => {
      const next = { ...prev, cheques: [...prev.cheques, cheque] };
      save(next);
      return next;
    });
    return cheque;
  }, [save]);

  const updateCheque = useCallback((id: string, patch: Partial<Cheque>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        cheques: prev.cheques.map(c => c.id === id ? { ...c, ...patch } : c),
      };
      save(next);
      return next;
    });
  }, [save]);

  const deleteCheque = useCallback((id: string) => {
    setDataState(prev => {
      const next = { ...prev, cheques: prev.cheques.filter(c => c.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  // --- Settings ---
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setDataState(prev => {
      const next = { ...prev, settings: { ...prev.settings, ...patch } };
      save(next);
      return next;
    });
  }, [save]);

  const updatePrintSettings = useCallback((patch: Partial<PrintSettings>) => {
    setDataState(prev => {
      const next = {
        ...prev,
        settings: { ...prev.settings, print: { ...prev.settings.print, ...patch } },
      };
      save(next);
      return next;
    });
  }, [save]);

  // --- PIN ---
  const verifyPin = useCallback((pin: string): boolean => {
    return data.settings.pin === pin;
  }, [data.settings.pin]);

  const setPin = useCallback((pin: string) => {
    setDataState(prev => {
      const next = { ...prev, settings: { ...prev.settings, pin } };
      save(next);
      return next;
    });
  }, [save]);

  // --- Backup ---
  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as AppData;
    if (!parsed.contacts || !parsed.products) throw new Error('فایل پشتیبان نامعتبر است');
    if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
    if (!parsed.settings.print) parsed.settings.print = DEFAULT_SETTINGS.print;
    if (!parsed.settings.pin) parsed.settings.pin = DEFAULT_SETTINGS.pin;
    if (!parsed.counters) parsed.counters = { contact: 0, product: 0, invoice: 0 };
    if (!parsed.bankAccounts) parsed.bankAccounts = [];
    if (!parsed.cheques) parsed.cheques = [];
    setDataState(parsed);
    save(parsed);
  }, [save]);

  const value: StoreContextValue = {
    data, setData, save,
    addContact, updateContact, deleteContact,
    addProduct, updateProduct, deleteProduct,
    addInvoice, updateInvoice, deleteInvoice, convertProformaToSale,
    addPayment, deletePayment,
    addBankAccount, updateBankAccount, deleteBankAccount,
    addCheque, updateCheque, deleteCheque,
    updateSettings, updatePrintSettings,
    verifyPin, setPin,
    exportJSON, importJSON,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
