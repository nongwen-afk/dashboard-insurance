"use client";

import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  iconClassName: string;
  onClick?: () => void;
  isActive?: boolean;
  activeType?: 'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED';
}

export default function StatCard({
  title,
  value,
  caption,
  icon,
  iconClassName,
  onClick,
  isActive = false,
  activeType = 'ALL'
}: StatCardProps) {

  const getActiveStyles = () => {
    if (!isActive) return 'border-slate-100 bg-white shadow-sm';

    switch (activeType) {
      case 'ACTIVE':
        return 'border-green-400 bg-green-50/25 shadow-md shadow-green-500/5 ring-4 ring-green-500/5';
      case 'WARNING':
        return 'border-orange-400 bg-orange-50/25 shadow-md shadow-orange-500/5 ring-4 ring-orange-500/5';
      case 'EXPIRED':
        return 'border-red-400 bg-red-50/25 shadow-md shadow-red-500/5 ring-4 ring-red-500/5';
      case 'ALL':
      default:
        return 'border-slate-300 bg-slate-50/40 shadow-md shadow-slate-500/5 ring-4 ring-slate-500/5';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${getActiveStyles()} ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] select-none'
          : ''
      }`}
    >
      <div>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1">{caption}</p>
      </div>
      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 border border-black/5 shadow-xs transition-transform duration-300 ${isActive ? 'scale-105' : ''} ${iconClassName}`}>
        <div className="scale-85 sm:scale-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
