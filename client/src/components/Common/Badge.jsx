import React from 'react';

export function Badge({ children, status, size = 'md' }) {
  const norm = (status || children || '').toString().toUpperCase();

  const colorMap = {
    ADMIN: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    HR: 'bg-yellow-100 text-yellow-900 border border-yellow-300 font-semibold',
    EMPLOYEE: 'bg-stone-100 text-stone-700 border border-stone-200 font-medium',

    PRESENT: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',

    PENDING: 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    HALF_DAY: 'bg-yellow-50 text-yellow-800 border border-yellow-200 font-medium',
    PROBATION: 'bg-yellow-50 text-yellow-800 border border-yellow-200 font-medium',

    ABSENT: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    INACTIVE: 'bg-stone-100 text-stone-500 border border-stone-200 font-medium',

    LEAVE: 'bg-sky-50 text-sky-700 border border-sky-200 font-medium',
    GENERATED: 'bg-stone-100 text-stone-700 border border-stone-200 font-medium',
  };

  const style = colorMap[norm] || 'bg-stone-100 text-stone-700 border border-stone-200 font-medium';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] rounded' : 'px-2.5 py-0.5 text-xs rounded-md';

  return (
    <span className={`inline-block ${style} ${sizeClasses} select-none tracking-tight`}>
      {children || status}
    </span>
  );
}

export default Badge;
