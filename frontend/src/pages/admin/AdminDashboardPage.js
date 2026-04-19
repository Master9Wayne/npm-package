import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, AlertTriangle, ArrowRight, PlusCircle } from 'lucide-react';
import { packageAPI } from '../../lib/api';
import { formatDate, getStatusConfig } from '../../lib/utils';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-display text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packageAPI.adminGetStats()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const { stats, recentPackages } = data || {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Parcel management overview</p>
        </div>
        <Link to="/admin/log-package"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          <PlusCircle className="w-4 h-4" /> Log Arrival
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total" value={stats?.total ?? 0} color="bg-muted text-muted-foreground" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
        <StatCard icon={CheckCircle2} label="Collected" value={stats?.collected ?? 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      {/* Recent packages */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold">Recent Arrivals</h2>
          <Link to="/admin/packages" className="text-sm text-primary hover:underline flex items-center gap-1">
            All packages <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {!recentPackages?.length ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No packages yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Package ID</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Arrived</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentPackages.map(pkg => {
                  const status = getStatusConfig(pkg.status);
                  return (
                    <tr key={pkg.package_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium">{pkg.package_id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium">{pkg.student?.name}</div>
                        <div className="text-xs text-muted-foreground">{pkg.student?.roll_no}</div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatDate(pkg.arrival_datetime)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
