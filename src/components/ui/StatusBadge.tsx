import type { TicketStatus } from '../../types';

interface StatusBadgeProps {
  status: TicketStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (s: string) => {
    switch (s.toLowerCase()) {
      case 'fresh':
      case 'open':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'pending':
      case 'on hold':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'closed':
      case 'solved':
      case 'archived':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'high':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paused':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
