import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, AlertTriangle, ArrowRight, Bell } from 'lucide-react';
import { studentAPI, packageAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { getDeadlineInfo, formatDateShort, getStatusConfig } from '../../lib/utils';

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`bg-card border border-border rounded-2xl p-5 card-hover flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPackages, setRecentPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, pkgRes] = await Promise.all([
          studentAPI.getDashboardStats(),
          packageAPI.getMyPackages({ status: 'PENDING' })
        ]);
        setStats(statsRes.data.stats);
        setRecentPackages(pkgRes.data.packages.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your parcel overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" to="/packages?status=PENDING" />
        <StatCard icon={CheckCircle2} label="Collected" value={stats?.collected ?? 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" to="/packages?status=COLLECTED" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" to="/packages?status=OVERDUE" />
        <StatCard icon={Bell} label="Unread" value={stats?.unreadNotifs ?? 0} color="bg-primary/10 text-primary" to="/notifications" />
      </div>

      {/* Pending packages */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-base">Pending Packages</h2>
          <Link to="/packages" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No pending packages</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentPackages.map(pkg => {
              const deadline = getDeadlineInfo(pkg.pickup_deadline);
              const status = getStatusConfig(pkg.status);
              return (
                <Link key={pkg.package_id} to={`/packages/${pkg.package_id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium">{pkg.package_id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {pkg.platform?.name || 'Unknown platform'} · Arrived {formatDateShort(pkg.arrival_datetime)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    <span className={`text-xs ${deadline.color}`}>{deadline.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming deadlines from stats */}
      {stats?.upcomingDeadlines?.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-sm text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {stats.upcomingDeadlines.map(pkg => (
              <Link key={pkg.package_id} to={`/packages/${pkg.package_id}`}
                className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <span className="font-mono text-sm">{pkg.package_id}</span>
                <span className="text-sm text-destructive font-medium">{getDeadlineInfo(pkg.pickup_deadline).label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
