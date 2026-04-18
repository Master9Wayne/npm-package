import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Moon, Sun, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { authAPI, studentAPI } from '../lib/api';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'login'); // login | register | admin | otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [hostels, setHostels] = useState([]);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: '', password: '', roll_no: '', name: '', room_no: '', hostel_id: '', otp: '' });

  useEffect(() => {
    studentAPI.getHostels().then(r => setHostels(r.data.hostels)).catch(() => {});
  }, []);

  function set(field) { return e => { setForm(p => ({ ...p, [field]: e.target.value })); setError(''); }; }

  async function handleStudentLogin(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authAPI.studentLogin({ phone: form.phone, password: form.password });
      if (res.data.otpRequired) {
        setPendingPhone(form.phone);
        setTab('otp');
      } else {
        login(res.data.token, res.data.student, 'student');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await authAPI.registerStudent({ roll_no: form.roll_no, name: form.name, phone: form.phone, password: form.password, room_no: form.room_no, hostel_id: form.hostel_id });
      setTab('login');
      setError('');
      setForm(p => ({ ...p, password: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  async function handleOTP(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authAPI.verifyOTP({ phone: pendingPhone, otp: form.otp });
      login(res.data.token, res.data.student, 'student');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally { setLoading(false); }
  }

  async function handleAdminLogin(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authAPI.adminLogin({ phone: form.phone, password: form.password });
      login(res.data.token, res.data.admin, 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleResendOTP() {
    try {
      await authAPI.resendOTP({ phone: pendingPhone });
    } catch { setError('Failed to resend OTP'); }
  }

  const inputCls = 'w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
  const btnCls = 'w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">NPM</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Tab bar */}
          {tab !== 'otp' && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              {[['login','Student Login'],['register','Register'],['admin','Admin']].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-7 shadow-xl shadow-black/5">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* Student Login */}
            {tab === 'login' && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="mb-5"><h2 className="font-display text-xl font-bold">Welcome back</h2><p className="text-sm text-muted-foreground mt-1">Sign in with your phone number</p></div>
                <input className={inputCls} type="tel" placeholder="Phone number" value={form.phone} onChange={set('phone')} required />
                <div className="relative">
                  <input className={inputCls} type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button className={btnCls} type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign In
                </button>
              </form>
            )}

            {/* Register */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="mb-4"><h2 className="font-display text-xl font-bold">Create account</h2><p className="text-sm text-muted-foreground mt-1">Register as a student</p></div>
                <input className={inputCls} placeholder="Roll Number (e.g. 241CS212)" value={form.roll_no} onChange={set('roll_no')} required />
                <input className={inputCls} placeholder="Full Name" value={form.name} onChange={set('name')} required />
                <input className={inputCls} type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')} required />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Room No." value={form.room_no} onChange={set('room_no')} />
                  <select className={inputCls} value={form.hostel_id} onChange={set('hostel_id')}>
                    <option value="">Select Hostel</option>
                    {hostels.map(h => <option key={h.hostel_id} value={h.hostel_id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <input className={inputCls} type={showPass ? 'text' : 'password'} placeholder="Password (min. 6 chars)" value={form.password} onChange={set('password')} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button className={btnCls} type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Register
                </button>
              </form>
            )}

            {/* OTP */}
            {tab === 'otp' && (
              <form onSubmit={handleOTP} className="space-y-4">
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold">Verify your identity</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit OTP sent to <span className="text-foreground font-medium">{pendingPhone}</span></p>
                </div>
                <input className={`${inputCls} text-center font-mono text-2xl tracking-[0.5em] letter-spacing`} type="text" maxLength={6} placeholder="• • • • • •" value={form.otp} onChange={set('otp')} required />
                <button className={btnCls} type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Verify OTP
                </button>
                <button type="button" onClick={handleResendOTP} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Resend OTP</button>
                <button type="button" onClick={() => setTab('login')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back to login</button>
              </form>
            )}

            {/* Admin Login */}
            {tab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="mb-5"><h2 className="font-display text-xl font-bold">Admin Portal</h2><p className="text-sm text-muted-foreground mt-1">Sign in to the management dashboard</p></div>
                <input className={inputCls} type="tel" placeholder="Admin phone number" value={form.phone} onChange={set('phone')} required />
                <div className="relative">
                  <input className={inputCls} type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button className={btnCls} type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Admin Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
