import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { packageAPI, adminAPI } from '../../lib/api';

export default function AdminLogPackagePage() {
  const [phone, setPhone] = useState('');
  const [student, setStudent] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [form, setForm] = useState({ platform_id: '', description: '', pickup_deadline_days: 7 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    adminAPI.getPlatforms().then(r => setPlatforms(r.data.platforms)).catch(() => {});
  }, []);

  async function lookupStudent(e) {
    e.preventDefault();
    if (!phone) return;
    setLookupLoading(true); setLookupError(''); setStudent(null);
    try {
      const r = await adminAPI.lookupStudent(phone);
      setStudent(r.data.student);
    } catch (err) {
      setLookupError(err.response?.data?.error || 'Student not found');
    } finally { setLookupLoading(false); }
  }

  async function logArrival(e) {
    e.preventDefault();
    if (!student) return;
    setSubmitLoading(true); setSubmitError(''); setSuccess(null);
    try {
      const r = await packageAPI.logArrival({
        student_phone: phone,
        platform_id: form.platform_id || undefined,
        description: form.description || undefined,
        pickup_deadline_days: parseInt(form.pickup_deadline_days)
      });
      setSuccess(r.data.package);
      setStudent(null); setPhone('');
      setForm({ platform_id: '', description: '', pickup_deadline_days: 7 });
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to log package');
    } finally { setSubmitLoading(false); }
  }

  const inputCls = 'w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Log Package Arrival</h1>
        <p className="text-muted-foreground text-sm mt-1">Register a new parcel for a student</p>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-400">Package logged successfully!</span>
          </div>
          <div className="text-sm text-green-700/80 dark:text-green-400/70 space-y-1 font-mono">
            <div>ID: {success.package_id}</div>
            <div>Student notified via SMS</div>
          </div>
        </div>
      )}

      {/* Step 1: Lookup student */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-sm flex items-center gap-2">
          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">1</span>
          Find Student
        </h2>
        <form onSubmit={lookupStudent} className="flex gap-2">
          <input className={`${inputCls} flex-1`} type="tel" placeholder="Student phone number" value={phone} onChange={e => { setPhone(e.target.value); setStudent(null); setLookupError(''); }} required />
          <button type="submit" disabled={lookupLoading || !phone}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0">
            {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        {lookupError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {lookupError}
          </div>
        )}

        {student && (
          <div className="bg-accent/50 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center font-display font-bold text-primary">
                {student.name[0]}
              </div>
              <div>
                <div className="font-semibold">{student.name}</div>
                <div className="text-sm text-muted-foreground font-mono">{student.roll_no}</div>
                <div className="text-xs text-muted-foreground">Room {student.room_no} · {student.hostel?.name}</div>
              </div>
            </div>
            {student.packages?.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Already has {student.packages.length} pending package(s)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Package details */}
      {student && (
        <form onSubmit={logArrival} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-slide-up">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2">
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">2</span>
            Package Details
          </h2>

          {submitError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">Platform (optional)</label>
            <select className={inputCls} value={form.platform_id} onChange={e => setForm(p => ({ ...p, platform_id: e.target.value }))}>
              <option value="">Select platform</option>
              {platforms.map(pl => <option key={pl.platform_id} value={pl.platform_id}>{pl.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Description (optional)</label>
            <input className={inputCls} placeholder="e.g. Small box, fragile" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Pickup Deadline (days)</label>
            <input className={inputCls} type="number" min={1} max={30} value={form.pickup_deadline_days} onChange={e => setForm(p => ({ ...p, pickup_deadline_days: e.target.value }))} />
          </div>

          <button type="submit" disabled={submitLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
            {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Log Package Arrival
          </button>
        </form>
      )}
    </div>
  );
}
