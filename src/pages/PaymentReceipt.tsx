import { ArrowRight, Printer } from 'lucide-react';
import { useStore } from '@/store';
import { formatRial, formatDate, contactTotalBalance } from '@/utils';
import { PAYMENT_METHOD_LABELS } from '@/types';
import type { Payment } from '@/types';

export function PaymentReceipt({
  payment, onBack,
}: {
  payment: Payment;
  onBack: () => void;
}) {
  const { data } = useStore();
  const settings = data.settings;
  const contact = data.contacts.find(c => c.id === payment.contactId);
  const bankAccount = payment.bankAccountId ? data.bankAccounts.find(b => b.id === payment.bankAccountId) : null;

  const isReceipt = payment.direction === 'receipt';
  const title = isReceipt ? 'رسید دریافت' : 'رسید پرداخت';

  const balanceAfter = contact
    ? contactTotalBalance(contact, data.invoices, data.payments)
    : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-4">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowRight size={18} /> بازگشت
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} /> چاپ رسید
        </button>
      </div>

      {/* Printable Receipt */}
      <div className="print-receipt bg-white text-black p-8 rounded-lg shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xl">
              {settings.logoText.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{settings.storeName}</h1>
              <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                {settings.storePhone && <p>تلفن: {settings.storePhone}</p>}
                {settings.storeAddress && <p>آدرس: {settings.storeAddress}</p>}
              </div>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            <p className="text-sm">تاریخ: {formatDate(payment.date)}</p>
            <p className="text-sm">شماره رسید: <span className="font-mono">{payment.id.slice(-8).toUpperCase()}</span></p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6 border border-gray-300 rounded p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{isReceipt ? 'دریافت‌کننده: ' : 'پرداخت‌کننده: '}</span>
              <span className="font-bold">{contact?.name ?? '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">کد: </span>
              <span className="font-mono">{contact?.code ?? '—'}</span>
            </div>
            {contact?.phone && (
              <div>
                <span className="text-gray-500">تلفن: </span>
                <span>{contact.phone}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">روش: </span>
              <span>{PAYMENT_METHOD_LABELS[payment.method]}</span>
            </div>
            {bankAccount && (
              <div>
                <span className="text-gray-500">حساب: </span>
                <span>{bankAccount.name} — {bankAccount.bankName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500 mb-1">{isReceipt ? 'مبلغ دریافتی' : 'مبلغ پرداختی'}</p>
          <p className="text-3xl font-bold">{formatRial(payment.amount)} ریال</p>
        </div>

        {/* Amount in words placeholder */}
        <div className="mb-6 border-t border-b border-gray-200 py-3 text-sm text-center text-gray-600">
          {payment.note && <p>توضیح: {payment.note}</p>}
        </div>

        {/* Balance */}
        {contact && (
          <div className="mb-6 text-sm">
            <span className="text-gray-500">مانده حساب پس از این تراکنش: </span>
            <span className="font-bold">
              {formatRial(Math.abs(balanceAfter))} ریال {balanceAfter > 0 ? '(بدهکار)' : balanceAfter < 0 ? '(طلبکار)' : '(تسویه)'}
            </span>
          </div>
        )}

        {/* Signatures */}
        <div className="flex justify-between mt-16 pt-4">
          <div className="text-center">
            <div className="w-40 border-t border-black pt-1 text-sm">{isReceipt ? 'امضای دریافت‌کننده' : 'امضای پرداخت‌کننده'}</div>
          </div>
          <div className="text-center">
            <div className="w-40 border-t border-black pt-1 text-sm">امضای مسئول فروشگاه</div>
          </div>
        </div>
      </div>
    </div>
  );
}
