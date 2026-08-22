import React from 'react';

export function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-xs p-5 hover:border-stone-300 transition duration-150 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
          {title && <h3 className="font-bold text-stone-900 text-sm tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
