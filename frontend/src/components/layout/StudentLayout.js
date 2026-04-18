import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, Users, Bell, LayoutDashboard, Globe, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { notificationAPI } from '../../lib/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/packages', icon: Package, label: 'Packages' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/community', icon: Globe, label: 'Community' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function fetchUnread() {
      notificationAPI.getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col w-64 bg-card border-r border-border h-full`}>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-none">NPM</div>
            <div className="text-xs text-muted-foreground mt-0.5">Package Manager</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-primary font-display font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{user?.roll_no}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {badge && unread > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-card border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Package className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">NPM</span>
          </div>
          <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />}
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
