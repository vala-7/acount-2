import { useState } from 'react';
import { StoreProvider } from '@/store';
import { Sidebar } from '@/components/Sidebar';
import type { Page } from '@/components/Sidebar';
import { LockScreen } from '@/components/LockScreen';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Contacts } from '@/pages/Contacts';
import { Invoices } from '@/pages/Invoices';
import { Payments } from '@/pages/Payments';
import { Settings } from '@/pages/Settings';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <StoreProvider>
        <LockScreen onUnlock={() => setUnlocked(true)} />
      </StoreProvider>
    );
  }

  return (
    <StoreProvider>
      <div className="min-h-screen bg-slate-950 text-slate-200 flex" dir="rtl">
        <Sidebar page={page} setPage={setPage} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'products' && <Products />}
          {page === 'contacts' && <Contacts />}
          {page === 'invoices' && <Invoices />}
          {page === 'payments' && <Payments />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </StoreProvider>
  );
}

export default App;
