interface AvatarProps {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  initials,
  color = 'bg-blue-500',
  size = 'md',
  className = ''
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-medium ${color} ${sizeClasses[size]} ${className}`}
    >
      {initials.substring(0, 2).toUpperCase()}
    </div>
  );
}
