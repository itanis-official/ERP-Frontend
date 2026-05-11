import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}
export function Card({
  children,
  className = '',
  noPadding = false,
  ...props
}: CardProps) {
  return <div className={`bg-white border border-gray-200 rounded-lg ${noPadding ? '' : 'p-6'} ${className}`} {...props}>
      {children}
    </div>;
}