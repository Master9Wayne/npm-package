import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { notificationAPI } from '../../lib/api';
import { timeAgo, getNotifIcon } from '../../lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    notificationAPI.getAll().then(r => setNotifications(r.data.notifications)).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await notificationAPI.markRead({ mark_all: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { }
    finally { setMarkingAll(false); }
  }

  async function markOneRead(id) {
    try {
      await notificationAPI.markRead({ notif_ids: [id] });
      setNotifications(prev => prev.map(n => n.notif_id === id ? { ...n, is_read: true } : n));
    } catch { }
  }

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          {unread > 0 && <p className="text-muted-foreground text-sm mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
            {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Bell className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {notifications.map(n => (
            <div key={n.notif_id} onClick={() => !n.is_read && markOneRead(n.notif_id)}
              className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${!n.is_read ? 'bg-accent/30 hover:bg-accent/50' : 'hover:bg-muted/30'}`}>
              <div className="text-xl flex-shrink-0 mt-0.5">{getNotifIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.sent_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
