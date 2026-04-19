import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, CheckCircle2, Loader2, Package } from 'lucide-react';
import { packageAPI } from '../../lib/api';
import { formatDate, formatDateShort, getStatusConfig, getDeadlineInfo } from '../../lib/utils';

const STATUS_FILTERS = ['ALL', 'PENDING', 'COLLECTED', 'OVERDUE'];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [collectModal, setCollectModal] = useState(null); // { package_id, roll_no }
  const [collectRoll, setCollectRoll] = useState('');
  const [collectLoading, setCollectLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (search) params.search = search;
    packageAPI.adminGetAll(params)
      .then(r => { setPackages(r.data.packages); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function markCollected() {
    setCollectLoading(true);
    try {
      await packageAPI.markCollected(collectModal.package_id, { collected_by_roll_no: collectRoll || collectModal.roll_no });
      setCollectModal(null);
      setCollectRoll('');
      load();
    } catch (e) { console.error(e); }
    finally { setCollectLoading(false); }
  }

  // Derive the effective status for display: if the deadline is past and the DB
  // still says PENDING (cron hasn't run yet), treat it as OVERDUE in the UI.
  function getEffectiveStatus(pkg) {
    if (pkg.status === 'PENDING' && new Date(pkg.pickup_deadline) < new Date()) {
      return 'OVERDUE';
    }
    return pkg.status;
  }

  // Always show deadline relative info for uncollected packages; highlight red if past.
  function getDeadlineCell(pkg) {
    const effectiveStatus = getEffectiveStatus(pkg);
    if (effectiveStatus === 'COLLECTED') {
      return <span className="text-muted-foreground">{formatDateShort(pkg.pickup_deadline)}</span>;
    }
    const info = getDeadlineInfo(pkg.pickup_deadline);
    return (
      <span className={`font-medium ${info.urgent ? 'text-red-500' : info.color}`}>
        {formatDateShort(pkg.pickup_deadline)}
        <span className="block text-xs font-normal">{info.label}</span>
      </span>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">All Packages</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total packages</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            placeholder="Search package ID, student name or roll no..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <select
            className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">No packages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Package ID', 'Student', 'Hostel/Room', 'Platform', 'Arrived', 'Deadline', 'Authorised', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {packages.map(pkg => {
                  const effectiveStatus = getEffectiveStatus(pkg);
                  const status = getStatusConfig(effectiveStatus);
                  // Find the active pickup auth (PENDING or ACCEPTED)
                  const activeAuth = pkg.pickup_auths?.find(a =>
                    a.status === 'ACCEPTED' || a.status === 'PENDING'
                  );
                  return (
                    <tr key={pkg.package_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{pkg.package_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{pkg.student?.name}</div>
                        <div className="text-xs text-muted-foreground">{pkg.student?.roll_no}</div>
                        <div className="text-xs text-muted-foreground">{pkg.student?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{pkg.student?.hostel?.name || '—'}</div>
                        <div>Room {pkg.student?.room_no || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{pkg.platform?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateShort(pkg.arrival_datetime)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {getDeadlineCell(pkg)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {activeAuth ? (
                          <div>
                            <div className="font-medium text-foreground font-mono">{activeAuth.authorized_to}</div>
                            <div className={`text-xs mt-0.5 capitalize ${activeAuth.status === 'ACCEPTED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                              {activeAuth.status.toLowerCase()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(pkg.status === 'PENDING' || pkg.status === 'OVERDUE') && (
                          <button onClick={() => { setCollectModal({ package_id: pkg.package_id, roll_no: pkg.roll_no }); setCollectRoll(pkg.roll_no); }}
                            className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-muted rounded-lg disabled:opacity-40 hover:bg-muted/80 transition-colors">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1.5 text-sm bg-muted rounded-lg disabled:opacity-40 hover:bg-muted/80 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Collect modal */}
      {collectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-slide-up">
            <h3 className="font-display font-bold">Mark as Collected</h3>
            <p className="text-sm text-muted-foreground">Package: <span className="font-mono text-foreground">{collectModal.package_id}</span></p>
            <div>
              <label className="text-sm font-medium block mb-1.5">Collected by (Roll No.)</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="Default: package owner"
                value={collectRoll} onChange={e => setCollectRoll(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">Leave as owner's roll no if they collected it themselves</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCollectModal(null)} className="flex-1 py-2.5 bg-muted text-foreground text-sm font-medium rounded-xl hover:bg-muted/80 transition-colors">Cancel</button>
              <button onClick={markCollected} disabled={collectLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
                {collectLoading && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
