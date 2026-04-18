import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Check, X, Loader2, Users, UserMinus } from 'lucide-react';
import { friendAPI, pickupAPI } from '../../lib/api';

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} bg-accent rounded-xl flex items-center justify-center font-display font-bold text-primary flex-shrink-0`}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState('friends'); // friends | search | requests | pickups
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pickupAuths, setPickupAuths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const loadFriends = useCallback(() => {
    friendAPI.getFriends().then(r => setFriends(r.data.friends)).catch(console.error);
  }, []);

  const loadRequests = useCallback(() => {
    friendAPI.getPendingRequests().then(r => setRequests(r.data.requests)).catch(console.error);
  }, []);

  const loadPickups = useCallback(() => {
    pickupAPI.getAuths('received').then(r => setPickupAuths(r.data.auths.filter(a => a.status === 'PENDING'))).catch(console.error);
  }, []);

  useEffect(() => { loadFriends(); loadRequests(); loadPickups(); }, [loadFriends, loadRequests, loadPickups]);

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setLoading(true);
    try {
      const r = await friendAPI.search(q);
      setSearchResults(r.data.students);
    } catch { setSearchResults([]); }
    finally { setLoading(false); }
  }

  async function sendRequest(roll_no) {
    setActionLoading(p => ({ ...p, [roll_no]: true }));
    try {
      await friendAPI.sendRequest({ receiver_roll_no: roll_no });
      setSearchResults(prev => prev.map(s => s.roll_no === roll_no ? { ...s, friendshipStatus: 'PENDING' } : s));
    } catch { }
    finally { setActionLoading(p => ({ ...p, [roll_no]: false })); }
  }

  async function respondRequest(id, action) {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await friendAPI.respondRequest(id, action);
      loadRequests(); loadFriends();
    } catch { }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  }

  async function removeFriend(id) {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await friendAPI.removeFriend(id);
      loadFriends();
    } catch { }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  }

  async function respondPickup(authId, action) {
    setActionLoading(p => ({ ...p, [authId]: true }));
    try {
      await pickupAPI.respond(authId, action);
      loadPickups();
    } catch { }
    finally { setActionLoading(p => ({ ...p, [authId]: false })); }
  }

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: requests.length },
    { id: 'pickups', label: 'Pickups', count: pickupAuths.length },
    { id: 'search', label: 'Find' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Friends</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your trusted friends for package pickup</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {t.label}
            {t.count > 0 && <span className={`text-xs rounded-full px-1.5 ${tab === t.id ? 'bg-white/20' : 'bg-background'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No friends yet</p>
              <p className="text-sm mt-1">Search for hostel mates to add</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {friends.map(f => (
                <div key={f.friendship_id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={f.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{f.name}</div>
                    <div className="text-xs text-muted-foreground">Room {f.room_no} · {f.hostel?.name}</div>
                  </div>
                  <button onClick={() => removeFriend(f.friendship_id)} disabled={actionLoading[f.friendship_id]}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
                    {actionLoading[f.friendship_id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending requests */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <UserPlus className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No pending requests</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {requests.map(r => (
                <div key={r.friendship_id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={r.requester.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{r.requester.name}</div>
                    <div className="text-xs text-muted-foreground">Room {r.requester.room_no}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(r.friendship_id, 'accept')} disabled={actionLoading[r.friendship_id]}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => respondRequest(r.friendship_id, 'decline')} disabled={actionLoading[r.friendship_id]}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pickup requests */}
      {tab === 'pickups' && (
        <div>
          {pickupAuths.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <p className="font-medium">No pending pickup requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pickupAuths.map(auth => (
                <div key={auth.auth_id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-medium text-sm">{auth.owner.name} wants you to collect a package</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{auth.package_id}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondPickup(auth.auth_id, 'accept')} disabled={actionLoading[auth.auth_id]}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
                      {actionLoading[auth.auth_id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                    </button>
                    <button onClick={() => respondPickup(auth.auth_id, 'decline')} disabled={actionLoading[auth.auth_id]}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-muted text-foreground text-sm font-medium rounded-xl hover:bg-muted/80 transition-colors">
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="Search students by name..."
              value={searchQuery} onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : searchResults.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {searchResults.map(s => (
                <div key={s.roll_no} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={s.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">Room {s.room_no}</div>
                  </div>
                  {s.friendshipStatus === 'ACCEPTED' ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Friends</span>
                  ) : s.friendshipStatus === 'PENDING' ? (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  ) : (
                    <button onClick={() => sendRequest(s.roll_no)} disabled={actionLoading[s.roll_no]}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                      {actionLoading[s.roll_no] ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No students found</div>
          )}
        </div>
      )}
    </div>
  );
}
