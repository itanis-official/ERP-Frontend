import { Badge } from "./ui/badge";

interface LeaveTypeBadgeProps {
  type: "Annuel" | "Maladie" | "Exceptionnel" | "Formation" | "Autre";
  icon?: boolean;
}

export function LeaveTypeBadge({ type, icon = true }: LeaveTypeBadgeProps) {
  const config = {
    Annuel: {
      icon: "🏖️",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    Maladie: {
      icon: "🏥",
      className: "bg-red-100 text-red-700 hover:bg-red-100",
    },
    Exceptionnel: {
      icon: "⭐",
      className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    },
    Formation: {
      icon: "📚",
      className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    },
    Autre: {
      icon: "🏫",
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    },
  };

  const { icon: emoji, className } = config[type];

  return (
    <Badge className={className}>
      {icon && emoji} {type}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "approved-chef" | "approved-rh";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: {
      label: "En Attente",
      className: "bg-[#FFF3CD] text-[#856404] hover:bg-[#FFF3CD]",
    },
    "approved-chef": {
      label: "Validé Chef",
      className: "bg-green-100 text-green-700 hover:bg-green-100",
      icon: "✓",
    },
    "approved-rh": {
      label: "Validé RH",
      className: "bg-[#D4EDDA] text-[#155724] hover:bg-[#D4EDDA]",
      icon: "✓✓",
    },
    approved: {
      label: "Validé",
      className: "bg-[#D4EDDA] text-[#155724] hover:bg-[#D4EDDA]",
      icon: "✓",
    },
    rejected: {
      label: "Refusé",
      className: "bg-[#F8D7DA] text-[#721C24] hover:bg-[#F8D7DA]",
      icon: "✗",
    },
  };

  const { label, className, icon } = config[status];

  return (
    <Badge className={className}>
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}

interface BalanceDisplayProps {
  balance: number;
  label?: string;
  showProgress?: boolean;
  className?: string;
}

export function BalanceDisplay({ balance, label = "Solde", showProgress = true, className = "" }: BalanceDisplayProps) {
  const isNegative = balance < 0;
  const isLow = balance > 0 && balance < 10;
  
  const borderColor = isNegative ? "border-l-red-500" : isLow ? "border-l-orange-500" : "border-l-green-500";
  const textColor = isNegative ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600";
  const progressColor = isNegative ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-green-500";

  return (
    <div className={`p-4 border-l-4 ${borderColor} bg-gray-50 rounded-lg ${className}`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>
        {balance > 0 ? "+" : ""}{balance} jours
      </p>
      {showProgress && (
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor}`}
            style={{ width: `${Math.min(Math.abs(balance) * 4, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
