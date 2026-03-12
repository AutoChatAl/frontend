import React from 'react';

import Input from '@/components/Input';

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
    <Input
      label={label}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      wrapperClassName={className}
    />
  );
}
