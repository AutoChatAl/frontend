import React from 'react';

interface FormFieldProps {
  label?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function FormField({
  label,
  type = 'text',
  defaultValue,
  placeholder,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
      />
    </div>
  );
}
