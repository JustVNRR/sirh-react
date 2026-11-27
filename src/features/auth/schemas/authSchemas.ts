import { z } from 'zod';

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'min-length',
    label: 'Au moins 10 caractères',
    test: (value) => value.length >= 10,
  },
  {
    id: 'uppercase',
    label: 'Au moins une lettre majuscule',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'lowercase',
    label: 'Au moins une lettre minuscule',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'digit',
    label: 'Au moins un chiffre',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'Au moins un caractère spécial',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export const strongPasswordSchema = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
  .refine((val) => PASSWORD_RULES.every((rule) => rule.test(val)), {
    message: 'Le mot de passe ne respecte pas tous les critères de sécurité.',
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse email professionnelle invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Adresse email professionnelle invalide.'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Adresse email professionnelle invalide.'),
    otpCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Le code OTP doit contenir exactement 6 chiffres.'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas.',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas.',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
