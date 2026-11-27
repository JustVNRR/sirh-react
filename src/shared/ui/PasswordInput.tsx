import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={className ? `pr-10 ${className}` : 'pr-10'}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
