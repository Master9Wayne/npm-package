import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, User, CheckCircle2, X, Loader2, UserCheck } from 'lucide-react';
import { packageAPI, pickupAPI, friendAPI } from '../../lib/api';
import { formatDate, getDeadlineInfo, getStatusConfig } from '../../lib/utils';

export default function PackageDetailPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [respondLoading, setRespondLoading] = useState(false);

  useEffect(() => {
    packageAPI.getPackageDetail(packageId)
      .then(r => setPkg(r.data.package))
      .catch(() => navigate('/packages'))
      .finally(() => setLoading(false));
    friendAPI.getFriends().then(r => setFriends(r.data.friends)).catch(() => {});
  }, [packageId]);

  async function handleAuthorize() {
    if (!selectedFriend) return;
    setAuthLoading(true); setAuthError('');
    try {
      await pickupAPI.authorize({ package_id: packageId, friend_roll_no: selectedFriend });
      setShowAuthModal(false);
      const r = await packageAPI.getPackageDetail(packageId);
      setPkg(r.data.package);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authorization failed');
    } finally { setAuthLoading(false); }
  }

  async function handleRevoke(authId) {
    setRespondLoading(true);
    try {
      await pickupAPI.revoke(authId);
      const r = await packageAPI.getPackageDetail(packageId);
      setPkg(r.data.package);
    } catch (e) { console.error(e); }
    finally { setRespondLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!pkg) return null;

  const status = getStatusConfig(pkg.status);
  const deadline = pkg.status === 'PENDING' ? getDeadlineInfo(pkg.pickup_deadline) : null;
  const activeAuth = pkg.pickup_auths?.find(a => ['PENDING', 'ACCEPTED'].includes(a.status));

  const timeline = [
    { label: 'Package Arrived', date: pkg.arrival_datetime, done: true },
    { label: 'Pickup Deadline', date: pkg.pickup_deadline, done: pkg.status !== 'PENDING' },
    { label: 'Collected', date: pkg.delivered_at, done: !!pkg.delivered_at },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <button onClick={() => navigate('/packages')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-lg font-bold">{pkg.package_id}</div>
            <div className="text-sm text-muted-foreground mt-1">{pkg.platform?.name || 'Unknown platform'} · {pkg.platform?.location || ''}</div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full flex-shrink-0 ${status.className}`}>{status.label}</span>
        </div>

        {deadline && (
          <div className={`mt-4 flex items-center gap-2 text-sm ${deadline.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Clock className="w-4 h-4" />
            <span>Pickup deadline: <strong>{formatDate(pkg.pickup_deadline)}</strong> ({deadline.label})</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-semibold mb-4 text-sm">Timeline</h3>
        <div className="space-y-4">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
              </div>
              <div>
                <div className="text-sm font-medium">{step.label}</div>
                <div className="text-xs text-muted-foreground">{step.date ? formatDate(step.date) : '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup Authorization */}
      {pkg.status === 'PENDING' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-3 text-sm">Pickup Authorization</h3>

          {activeAuth ? (
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{activeAuth.friend?.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{activeAuth.status.toLowerCase()}</div>
                </div>
              </div>
              <button onClick={() => handleRevoke(activeAuth.auth_id)} disabled={respondLoading}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1">
                {respondLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Revoke
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Allow a trusted friend to collect this package on your behalf.</p>
              <button onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                <UserCheck className="w-4 h-4" /> Authorize Friend
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collected by */}
      {pkg.delivered_at && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800 dark:text-green-400">Package Collected</div>
              <div className="text-xs text-green-700/70 dark:text-green-400/60">
                Collected by {pkg.delivered_to_student?.name || pkg.delivered_to} on {formatDate(pkg.delivered_at)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold">Authorize Pickup</h3>
              <button onClick={() => setShowAuthModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{authError}</div>}

            <div>
              <label className="text-sm font-medium mb-2 block">Select a friend</label>
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have no friends added yet. Add friends first.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {friends.map(f => (
                    <button key={f.roll_no} onClick={() => setSelectedFriend(f.roll_no)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${selectedFriend === f.roll_no ? 'border-primary bg-accent' : 'border-border hover:bg-muted'}`}>
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-display font-bold text-xs">
                        {f.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">Room {f.room_no}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleAuthorize} disabled={!selectedFriend || authLoading}
              className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Authorization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
