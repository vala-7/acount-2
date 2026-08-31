import { useState, useRef } from 'react';
import {
  Save, Download, Upload, Printer, Store, FileText, Plus, Trash2,
  AlertCircle, Check, Lock,
} from 'lucide-react';
import { useStore } from '@/store';
import { Modal } from '@/components/Modal';

export function Settings() {
  const { data, updateSettings, updatePrintSettings, exportJSON, importJSON } = useStore();
  const s = data.settings;

  const [storeName, setStoreName] = useState(s.storeName);
  const [storePhone, setStorePhone] = useState(s.storePhone);
  const [storeAddress, setStoreAddress] = useState(s.storeAddress);
  const [storeNationalId, setStoreNationalId] = useState(s.storeNationalId);
  const [logoText, setLogoText] = useState(s.logoText);
  const [savedMsg, setSavedMsg] = useState(false);

  const [footerNotes, setFooterNotes] = useState<string[]>(s.print.footerNotes);
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveStore = () => {
    updateSettings({ storeName, storePhone, storeAddress, storeNationalId, logoText });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleSavePrint = () => {
    updatePrintSettings({ footerNotes: footerNotes.filter(n => n.trim() !== '') });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleImport = async (file: File) => {
    try {
      setImportError('');
      await importJSON(file);
      setImportSuccess(true);
      setShowImport(false);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'خطا در بازیابی فایل');
    }
  };

  const togglePrint = (key: keyof typeof s.print) => {
    updatePrintSettings({ [key]: !s.print[key] } as any);
  };

  const printToggles: { key: keyof typeof s.print; label: string }[] = [
    { key: 'showSeller', label: 'اطلاعات فروشنده' },
    { key: 'showBuyer', label: 'اطلاعات خریدار' },
    { key: 'showLogo', label: 'نمایش لوگو' },
    { key: 'showNationalId', label: 'شناسه ملی' },
    { key: 'showSku', label: 'کد کالا در فاکتور' },
    { key: 'showPreviousBalance', label: 'مانده قبلی' },
    { key: 'showSignature', label: 'محل امضا' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">تنظیمات</h1>
        <p className="text-sm text-slate-400 mt-1">پیکربندی فروشگاه و چاپ</p>
      </div>

      {savedMsg && (
        <div className="card bg-emerald-600/20 border-emerald-600/40 p-3 flex items-center gap-2 text-emerald-300 text-sm">
          <Check size={18} /> تنظیمات ذخیره شد.
        </div>
      )}
      {importSuccess && (
        <div className="card bg-emerald-600/20 border-emerald-600/40 p-3 flex items-center gap-2 text-emerald-300 text-sm">
          <Check size={18} /> پشتیبان با موفقیت بازیابی شد.
        </div>
      )}

      {/* Store Info */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Store size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">اطلاعات فروشگاه</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">نام فروشگاه</label>
              <input className="input w-full" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="label">تلفن</label>
              <input className="input w-full" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">شناسه ملی</label>
              <input className="input w-full" value={storeNationalId} onChange={e => setStoreNationalId(e.target.value)} />
            </div>
            <div>
              <label className="label">حرف لوگو (یک کاراکتر)</label>
              <input className="input w-full" maxLength={1} value={logoText} onChange={e => setLogoText(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">آدرس</label>
            <textarea className="input w-full resize-none" rows={2} value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSaveStore}>
            <Save size={16} /> ذخیره اطلاعات فروشگاه
          </button>
        </div>
      </div>

      {/* Print Settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Printer size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">تنظیمات چاپ فاکتور</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {printToggles.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => togglePrint(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${s.print[key] ? 'bg-emerald-600' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.print[key] ? 'left-0.5' : 'right-0.5'}`} />
                </button>
                <span className="text-sm text-slate-200">{label}</span>
              </label>
            ))}
          </div>

          {/* Footer Notes */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">متن‌های پایین فاکتور (۱ تا ۵ خط)</label>
              <button
                className="btn btn-ghost !py-1 !text-xs"
                onClick={() => setFooterNotes(prev => prev.length < 5 ? [...prev, ''] : prev)}
                disabled={footerNotes.length >= 5}
              >
                <Plus size={14} /> افزودن خط
              </button>
            </div>
            <div className="space-y-2">
              {footerNotes.map((note, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={note}
                    onChange={e => setFooterNotes(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                    placeholder={`خط ${i + 1}`}
                  />
                  <button
                    className="btn btn-ghost !p-2 hover:!text-red-400"
                    onClick={() => setFooterNotes(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary mt-2" onClick={handleSavePrint}>
            <Save size={16} /> ذخیره تنظیمات چاپ
          </button>
        </div>
      </div>

      {/* PIN / Security */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">کد امنیتی (PIN)</h2>
        </div>
        <PinSection />
      </div>

      {/* Backup & Restore */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">پشتیبان‌گیری و بازیابی</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          تمام داده‌های شما (کالاها، اشخاص، فاکتورها و تنظیمات) به‌صورت خودکار در مرورگر ذخیره می‌شوند. برای انتقال به دستگاه دیگر یا اطمینان از حفظ داده، یک فایل پشتیبان تهیه کنید.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={exportJSON}>
            <Download size={16} /> پشتیبان‌گیری (خروجی JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => { setImportError(''); setShowImport(true); }}>
            <Upload size={16} /> بازیابی (ورودی JSON)
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <Modal open onClose={() => setShowImport(false)} title="بازیابی از فایل پشتیبان" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>بازیابی، تمام داده‌های فعلی را با محتوای فایل جایگزین می‌کند. این عمل قابل بازگشت نیست.</p>
            </div>
            {importError && (
              <p className="text-sm text-red-400">{importError}</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
            <button className="btn btn-primary w-full justify-center" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> انتخاب فایل پشتیبان
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PinSection() {
  const { data, verifyPin, setPin } = useStore();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleChange = () => {
    if (oldPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6) {
      setMsg({ type: 'err', text: 'کدها باید ۶ رقمی باشند.' });
      return;
    }
    if (!verifyPin(oldPin)) {
      setMsg({ type: 'err', text: 'کد فعلی اشتباه است.' });
      return;
    }
    if (newPin !== confirmPin) {
      setMsg({ type: 'err', text: 'کد جدید و تکرار آن یکسان نیستند.' });
      return;
    }
    setPin(newPin);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setMsg({ type: 'ok', text: 'کد امنیتی با موفقیت تغییر کرد.' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        کد امنیتی ۶ رقمی برای ورود به برنامه. کد پیش‌فرض: ۱۲۳۴۵۶
      </p>
      {msg && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          msg.type === 'ok' ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-300' : 'bg-red-600/20 border border-red-600/40 text-red-300'
        }`}>
          {msg.type === 'ok' ? <Check size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">کد فعلی</label>
          <input
            className="input w-full text-center tracking-widest"
            type="password"
            maxLength={6}
            value={oldPin}
            onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />
        </div>
        <div>
          <label className="label">کد جدید</label>
          <input
            className="input w-full text-center tracking-widest"
            type="password"
            maxLength={6}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />
        </div>
        <div>
          <label className="label">تکرار کد جدید</label>
          <input
            className="input w-full text-center tracking-widest"
            type="password"
            maxLength={6}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleChange}>
        <Save size={16} /> تغییر کد امنیتی
      </button>
    </div>
  );
}
