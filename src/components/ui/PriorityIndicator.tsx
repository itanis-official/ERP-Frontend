import { ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from 'lucide-react';
import type { TicketPriority } from '../../types';

interface PriorityIndicatorProps {
  priority: TicketPriority;
}

export function PriorityIndicator({ priority }: PriorityIndicatorProps) {
  switch (priority) {
    case 'high':
    case 'critical':
      return (
        <div className="flex items-center text-red-600" title="High Priority">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{priority === 'critical' ? 'Critical' : 'High'}</span>
        </div>
      );
    case 'medium':
      return (
        <div className="flex items-center text-orange-500" title="Medium Priority">
          <ArrowRightIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Medium</span>
        </div>
      );
    case 'low':
      return (
        <div className="flex items-center text-blue-500" title="Low Priority">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Low</span>
        </div>
      );
    default:
      return null;
  }
}
