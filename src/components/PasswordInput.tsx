'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import Input from '@/components/Input';

interface PasswordInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  wrapperClassName?: string;
}

export default function PasswordInput({
  label,
  placeholder = '••••••••',
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  wrapperClassName,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <Input
      label={label}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      {...(wrapperClassName ? { wrapperClassName } : {})}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}
