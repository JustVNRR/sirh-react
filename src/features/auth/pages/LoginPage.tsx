import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/shared/api/types';
import { useAuth } from '@/shared/auth/AuthContext';
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
import { loginSchema, type LoginFormValues } from '../schemas/authSchemas';

function getSafeRedirectPath(rawFrom: string | null): string {
  if (!rawFrom || !rawFrom.startsWith('/') || rawFrom.startsWith('//')) {
    return '/dashboard';
  }
  return rawFrom;
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isLocked) {
      return 'Compte temporairement verrouillé pendant 15 minutes suite à trop de tentatives échouées.';
    }
    if (error.isRateLimited) {
      return 'Trop de tentatives de connexion. Veuillez patienter avant de réessayer.';
    }
    if (error.isUnauthorized) {
      return 'Identifiants invalides ou compte désactivé.';
    }
    return error.detail;
  }
  return 'Impossible de contacter le serveur. Veuillez réessayer.';
}

export function LoginPage() {
  const { setAuthenticatedSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const tokens = await authApi.login(values);
      await setAuthenticatedSession(tokens);
      navigate(getSafeRedirectPath(searchParams.get('from')), { replace: true });
    } catch (error) {
      setServerError(getLoginErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion à l&apos;espace SIRH</CardTitle>
        <CardDescription>Connectez-vous avec votre adresse email professionnelle.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="danger" title="Échec de la connexion">
              {serverError}
            </Alert>
          )}

          <FormField id="email" label="Email professionnel" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@entreprise.fr"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField id="password" label="Mot de passe" required error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
