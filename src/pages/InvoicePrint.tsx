import { ArrowRight, Printer } from 'lucide-react';
import { useStore } from '@/store';
import {
  formatRial, formatDate, invoiceSubtotal, invoiceLineDiscount,
  invoiceVat, invoiceTotal, invoiceGlobalDiscount, lineNet, contactTotalBalance,
} from '@/utils';
import { INVOICE_TYPE_LABELS } from '@/types';
import type { Invoice } from '@/types';

export function InvoicePrint({
  invoice, onBack,
}: {
  invoice: Invoice;
  onBack: () => void;
}) {
  const { data } = useStore();
  const settings = data.settings;
  const print = settings.print;
  const contact = data.contacts.find(c => c.id === invoice.contactId);

  const subtotal = invoiceSubtotal(invoice.lines);
  const lineDiscount = invoiceLineDiscount(invoice.lines);
  const vat = invoiceVat(invoice.lines);
  const globalDisc = invoiceGlobalDiscount(invoice.lines, invoice);
  const total = invoiceTotal(invoice.lines, invoice);

  const previousBalance = contact ? contactTotalBalance(contact, data.invoices, data.payments) - total : 0;

  const handlePrint = () => {
    window.print();
  };

  const sellerLabel = invoice.type === 'purchase' ? 'خریدار' : 'فروشنده';
  const buyerLabel = invoice.type === 'purchase' ? 'فروشنده' : 'خریدار';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-4">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowRight size={18} /> بازگشت
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} /> چاپ فاکتور
        </button>
      </div>

      {/* Printable Invoice */}
      <div className="print-invoice bg-white text-black p-8 rounded-lg shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            {print.showLogo && (
              <div className="w-14 h-14 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xl">
                {settings.logoText.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{settings.storeName}</h1>
              {print.showSeller && (
                <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                  {settings.storePhone && <p>تلفن: {settings.storePhone}</p>}
                  {settings.storeAddress && <p>آدرس: {settings.storeAddress}</p>}
                  {print.showNationalId && settings.storeNationalId && <p>شناسه ملی: {settings.storeNationalId}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold mb-1">{INVOICE_TYPE_LABELS[invoice.type]}</h2>
            <p className="text-sm">شماره: <span className="font-mono">{invoice.number}</span></p>
            <p className="text-sm">تاریخ: {formatDate(invoice.date)}</p>
            {invoice.type === 'proforma' && (
              <p className="text-xs text-gray-500 mt-1">(این سند فاقد ارزش مالیاتی است)</p>
            )}
          </div>
        </div>

        {/* Buyer/Seller info */}
        {print.showBuyer && contact && (
          <div className="mb-6 border border-gray-300 rounded p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">{buyerLabel}:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-gray-500">نام: </span>{contact.name}</p>
              <p><span className="text-gray-500">کد: </span>{contact.code}</p>
              {contact.phone && <p><span className="text-gray-500">تلفن: </span>{contact.phone}</p>}
              {print.showNationalId && contact.nationalId && <p><span className="text-gray-500">شناسه ملی: </span>{contact.nationalId}</p>}
              {contact.address && <p className="col-span-2"><span className="text-gray-500">آدرس: </span>{contact.address}</p>}
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-right text-sm py-2 px-2 border border-gray-300">#</th>
              <th className="text-right text-sm py-2 px-2 border border-gray-300">شرح کالا</th>
              {print.showSku && <th className="text-right text-sm py-2 px-2 border border-gray-300">کد</th>}
              <th className="text-center text-sm py-2 px-2 border border-gray-300">واحد</th>
              <th className="text-center text-sm py-2 px-2 border border-gray-300">تعداد</th>
              <th className="text-left text-sm py-2 px-2 border border-gray-300">قیمت واحد</th>
              <th className="text-center text-sm py-2 px-2 border border-gray-300">تخفیف٪</th>
              <th className="text-left text-sm py-2 px-2 border border-gray-300">مبلغ کل</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, idx) => (
              <tr key={l.id} className="border-b border-gray-200">
                <td className="text-center text-sm py-2 px-2 border border-gray-300">{idx + 1}</td>
                <td className="text-right text-sm py-2 px-2 border border-gray-300">{l.name}</td>
                {print.showSku && <td className="text-right text-sm py-2 px-2 border border-gray-300 font-mono text-xs">{l.sku}</td>}
                <td className="text-center text-sm py-2 px-2 border border-gray-300">{l.unit}</td>
                <td className="text-center text-sm py-2 px-2 border border-gray-300">{formatRial(l.qty)}</td>
                <td className="text-left text-sm py-2 px-2 border border-gray-300">{formatRial(l.unitPrice)}</td>
                <td className="text-center text-sm py-2 px-2 border border-gray-300">{l.discountPct}%</td>
                <td className="text-left text-sm py-2 px-2 border border-gray-300 font-bold">{formatRial(lineNet(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">جمع کل:</span>
              <span>{formatRial(subtotal)} ریال</span>
            </div>
            {lineDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">تخفیف ردیف‌ها:</span>
                <span>- {formatRial(lineDiscount)} ریال</span>
              </div>
            )}
            {vat > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">مالیات بر ارزش افزوده:</span>
                <span>+ {formatRial(vat)} ریال</span>
              </div>
            )}
            {globalDisc > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">تخفیف کل فاکتور:</span>
                <span>- {formatRial(globalDisc)} ریال</span>
              </div>
            )}
            {print.showPreviousBalance && (
              <div className="flex justify-between text-gray-500">
                <span>مانده قبلی:</span>
                <span>{formatRial(Math.abs(previousBalance))} ریال {previousBalance > 0 ? '(بدهکار)' : '(طلبکار)'}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-black pt-2 font-bold text-base">
              <span>مبلغ نهایی:</span>
              <span>{formatRial(total)} ریال</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-4 text-sm border-t border-gray-200 pt-3">
            <span className="text-gray-500">توضیحات: </span>
            {invoice.notes}
          </div>
        )}

        {/* Footer notes */}
        {print.footerNotes.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mb-6 space-y-1">
            {print.footerNotes.map((note, i) => (
              <p key={i} className="text-xs text-gray-500">{note}</p>
            ))}
          </div>
        )}

        {/* Signatures */}
        {print.showSignature && (
          <div className="flex justify-between mt-12 pt-4">
            <div className="text-center">
              <div className="w-40 border-t border-black pt-1 text-sm">{sellerLabel}</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-black pt-1 text-sm">{buyerLabel}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
