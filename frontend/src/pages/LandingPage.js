import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Bell, ShieldCheck, Clock, ArrowRight, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const features = [
  { icon: Package, title: 'Real-Time Tracking', desc: 'Track every parcel from arrival to collection with live status updates and deadline countdowns.' },
  { icon: Users, title: 'Friend Authorization', desc: 'Trust a friend to collect your package. Authorize specific individuals for each parcel — full control, zero stress.' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Get notified on arrival, approaching deadlines, and pickup confirmations. Never miss a parcel again.' },
  { icon: ShieldCheck, title: 'Secure OTP Login', desc: 'Two-factor authentication via SMS for logins after long gaps, keeping your account safe.' },
  { icon: Clock, title: 'Deadline Management', desc: 'Auto-warnings at 80% of the deadline. Overdue packages are flagged before they\'re returned to sender.' },
  { icon: Zap, title: 'Admin Dashboard', desc: 'Hostel admins get a power-dense dashboard to log arrivals, filter packages, and manage returns.' },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-700 text-lg tracking-tight">NPM</span>
            <span className="hidden sm:block text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">NITK</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/auth?tab=register" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Now live at NITK Surathkal
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6">
            Your parcels,{' '}
            <span className="text-primary">under control.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            NPM digitizes hostel parcel management — from arrival logging to friend-authorized pickup. 
            No more lost packages, missed deadlines, or manual registers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?tab=register" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 animate-pulse-glow">
              Sign up as Student <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/auth?tab=admin" className="inline-flex items-center justify-center gap-2 border border-border bg-card text-foreground font-medium px-6 py-3 rounded-xl hover:bg-muted transition-colors">
              Admin Login
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 p-6 text-left animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">npm-dashboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Pending', value: '3', color: 'text-yellow-500' },
                { label: 'Collected', value: '12', color: 'text-green-500' },
                { label: 'Overdue', value: '1', color: 'text-red-500' },
                { label: 'Authorized', value: '2', color: 'text-primary' },
              ].map(s => (
                <div key={s.label} className="bg-muted/50 rounded-xl p-3">
                  <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { id: 'PKG-A3F2', platform: 'Amazon', status: 'PENDING', deadline: '4d left' },
                { id: 'PKG-B1C9', platform: 'Flipkart', status: 'COLLECTED', deadline: '—' },
                { id: 'PKG-D7E4', platform: 'Meesho', status: 'OVERDUE', deadline: 'Overdue' },
              ].map(p => (
                <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-foreground">{p.id}</span>
                  <span className="text-xs text-muted-foreground">{p.platform}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'PENDING' ? 'status-badge-pending' :
                    p.status === 'COLLECTED' ? 'status-badge-collected' : 'status-badge-overdue'
                  }`}>{p.status}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{p.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built for NITK hostels, designed to eliminate the chaos of manual parcel registers.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 card-hover">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">Join your hostel community and never worry about missed parcels again.</p>
          <Link to="/auth?tab=register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all text-base hover:shadow-lg hover:shadow-primary/25">
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Package className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">NPM</span>
            <span>— NITK Package Manager</span>
          </div>
          <span>© 2024 NITK Surathkal. Phase 1 Project.</span>
        </div>
      </footer>
    </div>
  );
}
