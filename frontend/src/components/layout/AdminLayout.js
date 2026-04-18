import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, LayoutDashboard, PlusCircle, LogOut, Moon, Sun, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/packages', icon: Package, label: 'All Packages' },
  { to: '/admin/log-package', icon: PlusCircle, label: 'Log Arrival' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() { logout(); navigate('/'); }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col w-60 bg-foreground text-background h-full`}>
      <div className="p-5 border-b border-background/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-none text-background">NPM Admin</div>
            <div className="text-xs text-background/50 mt-0.5">Management Portal</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-background/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-display font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-background truncate">{user?.name}</div>
            <div className="text-xs text-background/50">Administrator</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-background/15 text-background' : 'text-background/60 hover:bg-background/10 hover:text-background'
              }`
            }>
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-background/10 space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-background/60 hover:bg-background/10 hover:text-background transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-background/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 z-10"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-foreground border-b border-background/10">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-background/10 transition-colors text-background">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-sm text-background">NPM Admin</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
