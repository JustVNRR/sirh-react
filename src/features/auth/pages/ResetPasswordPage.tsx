import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PasswordInput,
} from '@/shared/ui';
import { authApi } from '../api/authApi';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/authSchemas';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('newPassword');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        email: values.email,
        otpCode: values.otpCode,
        newPassword: values.newPassword,
      });
      toast.success('Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError('Impossible de réinitialiser le mot de passe.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réinitialiser le mot de passe</CardTitle>
        <CardDescription>
          Saisissez le code à 6 chiffres reçu par email et choisissez un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="danger" title="Réinitialisation impossible">
              {serverError}
            </Alert>
          )}

          <FormField id="email" label="Email professionnel" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField
            id="otpCode"
            label="Code OTP (6 chiffres)"
            required
            error={errors.otpCode?.message}
          >
            <Input
              id="otpCode"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="font-mono tracking-widest"
              hasError={Boolean(errors.otpCode)}
              {...register('otpCode')}
            />
          </FormField>

          <FormField
            id="newPassword"
            label="Nouveau mot de passe"
            required
            error={errors.newPassword?.message}
          >
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              hasError={Boolean(errors.newPassword)}
              {...register('newPassword')}
            />
          </FormField>

          <PasswordRequirements password={watchedPassword} />

          <FormField
            id="confirmPassword"
            label="Confirmer le nouveau mot de passe"
            required
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </FormField>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Valider le nouveau mot de passe
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-xs font-medium text-[var(--primary)] hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
