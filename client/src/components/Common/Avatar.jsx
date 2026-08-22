import React from 'react';

export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const getInitials = (n) => {
    if (!n) return 'DF';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
    '2xl': 'w-16 h-16 sm:w-20 sm:h-20 text-xl font-bold',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (src && src.trim()) {
    return (
      <img
        src={src}
        alt={name}
        className={`${selectedSize} rounded-full object-cover ring-1 ring-stone-200 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${selectedSize} rounded-full bg-amber-100 text-amber-950 font-extrabold flex items-center justify-center border border-amber-200 select-none ${className}`}
      title={name}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}

export default Avatar;
