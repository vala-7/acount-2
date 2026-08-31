export type ContactType = 'customer' | 'supplier';

export interface Contact {
  id: string;
  code: string;
  name: string;
  type: ContactType;
  phone: string;
  nationalId: string;
  address: string;
  openingBalance: number; // Rial, positive = they owe us
  createdAt: number;
}

export type Unit = 'عدد' | 'کیلوگرم' | 'متر' | 'لیتر' | 'دستگاه' | 'بسته' | 'جعبه' | 'رول' | 'شانه' | 'تن';

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: Unit;
  category: string;
  purchasePrice: number; // Rial
  salePrice: number; // Rial
  stock: number;
  minStock: number;
  barcode: string;
  createdAt: number;
}

export type InvoiceType = 'sale' | 'purchase' | 'return' | 'proforma';

export interface InvoiceLine {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unit: Unit;
  qty: number;
  unitPrice: number;
  discountPct: number;
  vatPct: number;
}

export type GlobalDiscountType = 'percent' | 'amount';

export interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  contactId: string;
  date: number;
  lines: InvoiceLine[];
  globalDiscountType: GlobalDiscountType;
  globalDiscountValue: number;
  notes: string;
  paid: boolean;
  paymentLocked: boolean;
  createdAt: number;
}

export type PaymentMethod = 'cash' | 'bank' | 'cheque';
export type PaymentDirection = 'receipt' | 'payment'; // receipt = we receive, payment = we pay

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  posTerminal: string;
  createdAt: number;
}

export type ChequeStatus = 'pending' | 'cleared' | 'bounced' | 'cancelled';

export interface Cheque {
  id: string;
  number: string;
  direction: PaymentDirection; // receipt = received cheque, payment = issued cheque
  contactId: string;
  amount: number;
  issueDate: number;
  dueDate: number;
  bankName: string;
  status: ChequeStatus;
  note: string;
  bankAccountId?: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  contactId: string;
  direction: PaymentDirection;
  amount: number; // Rial, always positive
  date: number;
  method: PaymentMethod;
  note: string;
  bankAccountId?: string;
  chequeId?: string;
  createdAt: number;
}

export interface PrintSettings {
  showSeller: boolean;
  showBuyer: boolean;
  showLogo: boolean;
  showNationalId: boolean;
  showSku: boolean;
  showPreviousBalance: boolean;
  showSignature: boolean;
  footerNotes: string[];
}

export interface AppSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeNationalId: string;
  logoText: string;
  pin: string;
  print: PrintSettings;
}

export interface AppData {
  contacts: Contact[];
  products: Product[];
  invoices: Invoice[];
  payments: Payment[];
  bankAccounts: BankAccount[];
  cheques: Cheque[];
  settings: AppSettings;
  counters: {
    contact: number;
    product: number;
    invoice: number;
  };
}

export const UNIT_LABELS: Record<Unit, string> = {
  'عدد': 'عدد',
  'کیلوگرم': 'کیلوگرم',
  'متر': 'متر',
  'لیتر': 'لیتر',
  'دستگاه': 'دستگاه',
  'بسته': 'بسته',
  'جعبه': 'جعبه',
  'رول': 'رول',
  'شانه': 'شانه',
  'تن': 'تن',
};

export const UNIT_LIST: Unit[] = [
  'عدد', 'دستگاه', 'کیلوگرم', 'متر', 'لیتر', 'بسته', 'جعبه', 'رول', 'شانه', 'تن',
];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  sale: 'فاکتور فروش',
  purchase: 'فاکتور خرید',
  return: 'فاکتور برگشت از فروش',
  proforma: 'پیش‌فاکتور',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'صندوق',
  bank: 'بانک / پوز',
  cheque: 'چک',
};

export const CHEQUE_STATUS_LABELS: Record<ChequeStatus, string> = {
  pending: 'در جریان',
  cleared: 'وصول‌شده',
  bounced: 'برگشت‌خورده',
  cancelled: 'باطل‌شده',
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'فروشگاه من',
  storePhone: '',
  storeAddress: '',
  storeNationalId: '',
  logoText: 'فروشگاه',
  pin: '123456',
  print: {
    showSeller: true,
    showBuyer: true,
    showLogo: true,
    showNationalId: true,
    showSku: true,
    showPreviousBalance: true,
    showSignature: true,
    footerNotes: ['کالاها مطابق فاکتور تحویل گردید.', 'این فاکتور فاقد ارزش مالیاتی است.'],
  },
};

export function emptyData(): AppData {
  return {
    contacts: [],
    products: [],
    invoices: [],
    payments: [],
    bankAccounts: [],
    cheques: [],
    settings: DEFAULT_SETTINGS,
    counters: { contact: 0, product: 0, invoice: 0 },
  };
}
