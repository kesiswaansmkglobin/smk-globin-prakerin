import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Duration in seconds for the loading animation cycle */
  duration?: number;
}

export const LoadingSpinner = ({ 
  message = 'Memuat data...', 
  size = 'md',
  className = '',
  duration = 0.2
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-primary mb-2`} 
        style={{ animation: `spin ${duration}s linear infinite` }}
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingSpinner;