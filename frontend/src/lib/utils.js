import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInHours, isPast } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, h:mm a');
}

export function formatDateShort(date) {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

export function timeAgo(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDeadlineInfo(pickup_deadline) {
  const deadline = new Date(pickup_deadline);
  const now = new Date();
  if (isPast(deadline)) return { label: 'Overdue', color: 'text-red-500', urgent: true };
  const hours = differenceInHours(deadline, now);
  if (hours < 24) return { label: `${hours}h left`, color: 'text-red-500', urgent: true };
  if (hours < 72) return { label: `${Math.ceil(hours / 24)}d left`, color: 'text-orange-500', urgent: true };
  return { label: `${Math.ceil(hours / 24)}d left`, color: 'text-muted-foreground', urgent: false };
}

export function getStatusConfig(status) {
  const map = {
    PENDING: { label: 'Pending', className: 'status-badge-pending' },
    COLLECTED: { label: 'Collected', className: 'status-badge-collected' },
    OVERDUE: { label: 'Overdue', className: 'status-badge-overdue' },
    RETURNING: { label: 'Returning', className: 'status-badge-returning' },
    RETURNED: { label: 'Returned', className: 'status-badge-returned' },
  };
  return map[status] || { label: status, className: 'status-badge-pending' };
}

export function getNotifIcon(type) {
  const map = {
    ARRIVAL: '📦',
    DEADLINE_WARNING: '⚠️',
    PICKUP_AUTHORIZED: '🤝',
    PICKUP_CONFIRMED: '✅',
    FRIEND_REQUEST: '👋',
    RETURNING: '↩️',
  };
  return map[type] || '🔔';
}
