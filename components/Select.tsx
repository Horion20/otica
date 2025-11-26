import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className, ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`w-full bg-white dark:bg-slate-800 border ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30' : 'border-slate-200 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-200 dark:focus:ring-brand-900/50'} rounded-lg shadow-sm py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 appearance-none`}
        >
          <option value="" disabled className="dark:bg-slate-800 text-slate-500">Selecione...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-slate-800">{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <i className="fas fa-chevron-down text-xs"></i>
        </div>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};