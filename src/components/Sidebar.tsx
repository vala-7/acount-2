import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Users, FileText, Settings, Store,
  Calculator, Menu, X, Wallet,
} from 'lucide-react';

export type Page = 'dashboard' | 'products' | 'contacts' | 'invoices' | 'payments' | 'settings';

interface SidebarProps {
  page: Page;
  setPage: (p: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'products', label: 'کالاها', icon: Package },
  { id: 'contacts', label: 'اشخاص', icon: Users },
  { id: 'invoices', label: 'فاکتورها', icon: FileText },
  { id: 'payments', label: 'دریافت و پرداخت', icon: Wallet },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export function Sidebar({ page, setPage }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [page]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="no-print fixed top-4 right-4 z-40 btn btn-secondary !p-2 rounded-lg md:hidden"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        no-print fixed md:sticky top-0 right-0 h-screen w-64 bg-slate-900/95 backdrop-blur-md
        border-l border-slate-700/50 z-40 flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Calculator size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-tight">حسابداری فروشگاهی</h1>
              <p className="text-xs text-slate-500">مدیریت جامع</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${page === item.id ? 'nav-active' : 'nav-inactive'}`}
                onClick={() => setPage(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Store size={14} />
            <span>نسخه ۲.۰ — ذخیره محلی</span>
          </div>
        </div>
      </aside>
    </>
  );
}
