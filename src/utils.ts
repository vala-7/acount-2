import type { Invoice, InvoiceLine, Payment, Contact, InvoiceType, Cheque, PaymentDirection } from '@/types';

// ─── Jalali (Persian Solar) Calendar Conversion ───
// Algorithm based on the algorithm by Kazimierz M. Borkowski
// Converts Gregorian timestamp to Jalali (Shamsi) date components

interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : 186 + (jm - 7) * 30);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36525);
    days %= 36525;
  }
  if (days > 365) {
    gy += Math.floor(days / 365);
    days %= 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let leap = true;
  for (gm = 0; gm < 13; gm++) {
    let v = 0;
    if (leap && gm === 2) v = 1;
    if (gd <= sal_a[gm] + v) break;
    gd -= sal_a[gm] + v;
    leap = ((gy % 4) === 0 && (gy % 100) !== 0) || (gy % 400) === 0;
  }
  return [gy, gm, gd];
}

const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export function toJalali(ts: number): JalaliDate {
  const d = new Date(ts);
  return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function formatJalaliDate(ts: number): string {
  const { jy, jm, jd } = toJalali(ts);
  return `${jd} ${JALALI_MONTH_NAMES[jm - 1]} ${jy}`;
}

export function formatJalaliDateShort(ts: number): string {
  const { jy, jm, jd } = toJalali(ts);
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

export function formatJalaliDateTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatJalaliDate(ts)} - ${hh}:${mm}`;
}

export function jalaliToTimestamp(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, 12, 0, 0).getTime();
}

export function todayJalali(): { jy: number; jm: number; jd: number } {
  return toJalali(Date.now());
}

export function gregorianDateInputValue(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function timestampFromGregorianInput(value: string): number {
  return new Date(value + 'T12:00:00').getTime();
}

// ─── Currency Formatting ───

export function formatRial(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return sign + abs.toLocaleString('en-US');
}

export function formatRialWithSuffix(n: number): string {
  return formatRial(n) + ' ریال';
}

// ─── Date Formatting (now uses Jalali) ───

export function formatDate(ts: number): string {
  return formatJalaliDate(ts);
}

export function formatDateTime(ts: number): string {
  return formatJalaliDateTime(ts);
}

// ─── Invoice Calculations ───

export function lineNet(l: InvoiceLine): number {
  const gross = l.qty * l.unitPrice;
  const afterDisc = gross * (1 - l.discountPct / 100);
  const vat = afterDisc * (l.vatPct / 100);
  return afterDisc + vat;
}

export function lineGross(l: InvoiceLine): number {
  return l.qty * l.unitPrice;
}

export function invoiceSubtotal(lines: InvoiceLine[]): number {
  return lines.reduce((s, l) => s + lineGross(l), 0);
}

export function invoiceLineDiscount(lines: InvoiceLine[]): number {
  return lines.reduce((s, l) => s + lineGross(l) * (l.discountPct / 100), 0);
}

export function invoiceVat(lines: InvoiceLine[]): number {
  return lines.reduce((s, l) => {
    const afterDisc = lineGross(l) * (1 - l.discountPct / 100);
    return s + afterDisc * (l.vatPct / 100);
  }, 0);
}

export function invoiceTotal(lines: InvoiceLine[], inv: Invoice): number {
  const linesNet = lines.reduce((s, l) => s + lineNet(l), 0);
  if (inv.globalDiscountType === 'percent') {
    return Math.max(0, linesNet * (1 - inv.globalDiscountValue / 100));
  }
  return Math.max(0, linesNet - inv.globalDiscountValue);
}

export function invoiceGlobalDiscount(lines: InvoiceLine[], inv: Invoice): number {
  const linesNet = lines.reduce((s, l) => s + lineNet(l), 0);
  if (inv.globalDiscountType === 'percent') {
    return linesNet * (inv.globalDiscountValue / 100);
  }
  return Math.min(linesNet, inv.globalDiscountValue);
}

// ─── Contact Balance ───

export function contactBalance(contactId: string, invoices: Invoice[], payments: Payment[]): number {
  let bal = 0;
  for (const inv of invoices) {
    if (inv.contactId !== contactId) continue;
    const total = invoiceTotal(inv.lines, inv);
    if (inv.type === 'sale' || inv.type === 'proforma') bal += total;
    else if (inv.type === 'purchase') bal -= total;
    else if (inv.type === 'return') bal -= total;
  }
  for (const p of payments) {
    if (p.contactId !== contactId) continue;
    if (p.direction === 'receipt') bal -= p.amount;
    else bal += p.amount;
  }
  return bal;
}

export function contactOpeningBalance(contact: Contact): number {
  return contact.openingBalance;
}

export function contactTotalBalance(contact: Contact, invoices: Invoice[], payments: Payment[]): number {
  return contact.openingBalance + contactBalance(contact.id, invoices, payments);
}

// ─── Stock ───

export function productStock(productId: string, invoices: Invoice[]): number {
  let s = 0;
  for (const inv of invoices) {
    for (const l of inv.lines) {
      if (l.productId !== productId) continue;
      if (inv.type === 'sale') s -= l.qty;
      else if (inv.type === 'purchase' || inv.type === 'return') s += l.qty;
    }
  }
  return s;
}

export function effectiveStock(productId: string, baseStock: number, invoices: Invoice[]): number {
  return baseStock + productStock(productId, invoices);
}

export function invoiceAffectsStock(type: InvoiceType): boolean {
  return type === 'sale' || type === 'purchase' || type === 'return';
}

// ─── Cheque Helpers ───

export function pendingCheques(cheques: Cheque[], contactId?: string): Cheque[] {
  return cheques.filter(c => {
    if (c.status !== 'pending') return false;
    if (contactId && c.contactId !== contactId) return false;
    return true;
  });
}

export function chequeValue(c: Cheque, direction: PaymentDirection): number {
  if (c.direction !== direction) return 0;
  if (c.status === 'cleared') return c.amount;
  return 0;
}

// ─── ID Generator ───

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
