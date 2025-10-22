
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  linkTo?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const Logo = ({ linkTo = true, size = 'md', className = '' }: LogoProps) => {
  // Determine text size based on prop
  const textSize = {
    'sm': 'text-lg',
    'md': 'text-xl',
    'lg': 'text-2xl',
    'xl': 'text-3xl',
    '2xl': 'text-4xl',
  }[size];
  
  const logoText = (
    <span className={`font-bold ${textSize} ${className}`}>
      <span className="text-foodRed">DineFine</span>
      <span className="text-foodOrange">AI</span>
    </span>
  );
  
  if (linkTo) {
    return (
      <Link to="/home" className="flex items-center space-x-2">
        {logoText}
      </Link>
    );
  }
  
  return logoText;
};

export default Logo;
