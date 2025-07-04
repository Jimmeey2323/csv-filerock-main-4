
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md'
}) => {
  const sizesMap = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto'
  };
  
  return (
    <div className={cn("flex items-center group", className)}>
      <div className="relative mr-4">
        <img 
          src="https://i.imgur.com/9mOm7gP.png" 
          alt="Studio Analytics" 
          className="w-[50px] transition-all duration-300 group-hover:scale-105" 
        />
        <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div>
        <span className="font-bold text-slate-900 text-3xl md:text-4xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
          Performance Analytics
        </span>
        <div className="h-1 w-0 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:w-full transition-all duration-500"></div>
      </div>
    </div>
  );
};

export default Logo;
