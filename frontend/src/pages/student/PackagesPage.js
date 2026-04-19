import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, ChevronRight, Search } from 'lucide-react';
import { packageAPI } from '../../lib/api';
import { getDeadlineInfo, formatDateShort, getStatusConfig } from '../../lib/utils';

const STATUS_TABS = ['ALL', 'PENDING', 'COLLECTED', 'OVERDUE'];

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeStatus = searchParams.get('status') || 'ALL';

  useEffect(() => {
    setLoading(true);
    const params = activeStatus !== 'ALL' ? { status: activeStatus } : {};
    packageAPI.getMyPackages(params)
      .then(r => setPackages(r.data.packages))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeStatus]);

  const filtered = packages.filter(p =>
    !search || p.package_id.toLowerCase().includes(search.toLowerCase()) ||
    p.platform?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">My Packages</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all your parcels</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          placeholder="Search by package ID or platform..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setSearchParams(s === 'ALL' ? {} : { status: s })}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeStatus === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">No packages found</p>
          <p className="text-sm mt-1">Try a different filter</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {filtered.map(pkg => {
            const deadline = getDeadlineInfo(pkg.pickup_deadline);
            const status = getStatusConfig(pkg.status);
            const hasActiveAuth = pkg.pickup_auths?.[0]?.status === 'ACCEPTED';
            return (
              <Link key={pkg.package_id} to={`/packages/${pkg.package_id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/40 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{pkg.package_id}</span>
                    {hasActiveAuth && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Authorized</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {pkg.platform?.name || 'Unknown'} · {formatDateShort(pkg.arrival_datetime)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                  {pkg.status === 'PENDING' && (
                    <span className={`text-xs ${deadline.color}`}>{deadline.label}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
