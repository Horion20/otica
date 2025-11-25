import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className, ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium text-slate-700 flex justify-between">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-white border ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-200'} rounded-lg shadow-sm py-2.5 px-3 ${icon ? 'pl-10' : ''} text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200`}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};