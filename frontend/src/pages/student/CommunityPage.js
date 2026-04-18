import React, { useState, useEffect } from 'react';
import { Globe, Package, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { communityAPI } from '../../lib/api';
import { formatDateShort } from '../../lib/utils';

export default function CommunityPage() {
  const [friendsPackages, setFriendsPackages] = useState([]);
  const [optIn, setOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    communityAPI.getFriendsPackagesToday()
      .then(r => setFriendsPackages(r.data.friendsPackages))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleOptIn() {
    setToggling(true);
    try {
      await communityAPI.toggleOptIn(!optIn);
      setOptIn(p => !p);
    } catch { }
    finally { setToggling(false); }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">See which friends have packages arriving today</p>
      </div>

      {/* Opt-in toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">Community Notifications</div>
          <div className="text-xs text-muted-foreground mt-0.5">Let friends see when you have arrivals today</div>
        </div>
        <button onClick={toggleOptIn} disabled={toggling} className="text-primary transition-colors">
          {toggling ? <Loader2 className="w-6 h-6 animate-spin" /> : optIn ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
        </button>
      </div>

      {/* Friends with packages today */}
      <div>
        <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Friends with packages today
        </h2>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" /></div>
        ) : friendsPackages.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
            <Package className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-medium text-sm">No friends have packages today</p>
            <p className="text-xs mt-1">Check back later</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {friendsPackages.map(pkg => (
              <div key={pkg.package_id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center font-display font-bold text-sm text-primary flex-shrink-0">
                  {pkg.student.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{pkg.student.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {pkg.platform?.name || 'Unknown'} · Room {pkg.student.room_no}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDateShort(pkg.arrival_datetime)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
