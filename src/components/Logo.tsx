'use client';

import React from 'react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px] tracking-widest',
    md: 'text-[10px] tracking-[0.18em]',
    lg: 'text-xs tracking-[0.2em]',
    xl: 'text-sm tracking-[0.22em]',
  };

  const ShieldIcon = ({ className: iconClass = '' }: { className?: string }) => (
    <svg
      viewBox="0 0 100 100"
      className={`${iconClass} filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path
        d="M50 8 C72.5 8, 87.5 18, 87.5 38 C87.5 65, 67.5 85, 50 92 C32.5 85, 12.5 65, 12.5 38 C12.5 18, 27.5 8, 50 8 Z"
        fill="url(#shieldGradient)"
      />
      {/* Shield inner stroke */}
      <path
        d="M50 13 C70 13, 83 22, 83 38 C83 62, 65 80, 50 86.5 C35 80, 17 62, 17 38 C17 22, 30 13, 50 13 Z"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2.5"
      />
      {/* Medical Cross */}
      <path
        d="M44 29 C44 27.3 45.3 26 47 26 H53 C54.7 26 56 27.3 56 29 V39 H66 C67.7 39 69 40.3 69 42 V48 C69 49.7 67.7 51 66 51 H56 V61 C56 62.7 54.7 64 53 64 H47 C45.3 64 44 62.7 44 61 V51 H34 C32.3 51 31 49.7 31 48 V42 C31 40.3 32.3 39 34 39 H44 V29 Z"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <ShieldIcon className={iconSizes[size]} />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <ShieldIcon className={size === 'xl' ? 'h-24 w-24 mb-3' : 'h-16 w-16 mb-2'} />
        <div className="font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
          <span className="text-teal-500 dark:text-teal-400">Med</span>
          <span className="text-teal-300">.</span>
          <span className="text-teal-400 dark:text-teal-300">Na</span>
        </div>
        {showSubtitle && (
          <>
            <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full my-2" />
            <span className="font-bold uppercase text-teal-300 text-xs tracking-[0.2em]">
              Clínica Médica Virtual
            </span>
          </>
        )}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`group flex items-center gap-2.5 select-none ${className}`}>
      <ShieldIcon className={iconSizes[size]} />
      <div className="flex flex-col leading-tight">
        <span className={`font-extrabold tracking-tight ${textSizes[size]}`}>
          <span className="text-teal-700 dark:text-teal-400">Med</span>
          <span className="text-teal-400">.</span>
          <span className="text-teal-600 dark:text-teal-300">Na</span>
        </span>
        {showSubtitle && (
          <span className={`font-bold uppercase text-teal-800 dark:text-teal-300/90 ${subtitleSizes[size]} -mt-0.5`}>
            Clínica Médica Virtual
          </span>
        )}
      </div>
    </div>
  );
};
