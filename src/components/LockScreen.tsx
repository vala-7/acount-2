import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';
import { useStore } from '@/store';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { verifyPin } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + d;
    setPin(newPin);
    setError(false);
    if (newPin.length === 6) {
      setTimeout(() => {
        if (verifyPin(newPin)) {
          onUnlock();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setPin('');
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter' && pin.length === 6) {
      if (verifyPin(pin)) onUnlock();
      else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[100] no-print" dir="rtl">
      <div className={`text-center space-y-8 ${shake ? 'animate-shake' : ''}`}>
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            error ? 'bg-red-600/20 text-red-400' : 'bg-emerald-600/20 text-emerald-400'
          }`}>
            {error ? <Lock size={40} /> : <Unlock size={40} />}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-100">کد امنیتی را وارد کنید</h1>
          <p className="text-sm text-slate-400 mt-2">برای ورود به برنامه، ۶ رقم پین را وارد کنید</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error ? 'bg-red-500' : 'bg-emerald-500'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          className="sr-only"
          value={pin}
          onKeyDown={handleKeyDown}
          onChange={() => {}}
        />

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-slate-700 text-2xl font-bold text-slate-100 transition-all active:scale-95"
              onClick={() => handleDigit(d)}
            >
              {d}
            </button>
          ))}
          <div />
          <button
            className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-slate-700 text-2xl font-bold text-slate-100 transition-all active:scale-95"
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            className="w-16 h-16 rounded-xl bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-all active:scale-95 flex items-center justify-center"
            onClick={handleDelete}
          >
            <Delete size={24} />
          </button>
        </div>

        <p className="text-xs text-slate-600">پیش‌فرض: ۱۲۳۴۵۶ (قابل تغییر در تنظیمات)</p>
      </div>
    </div>
  );
}
