import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { useAuth } from '@/shared/auth/AuthContext';
import { tokenStore } from '@/shared/auth/tokenStore';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FormField,
  PageHeader,
  PasswordInput,
} from '@/shared/ui';
import { authApi } from '../api/authApi';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas/authSchemas';

export function AccountSecurityPage() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = useWatch({ control, name: 'newPassword', defaultValue: '' });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      clearSession(true);
      toast.success('Mot de passe mis à jour. Toutes vos sessions ont été révoquées.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError('Impossible de modifier le mot de passe.');
      }
    }
  };

  const handleLogoutCurrent = async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearSession(true);
      navigate('/login', { replace: true });
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast.success('Toutes vos sessions actives ont été déconnectées.');
    } finally {
      setIsLoggingOutAll(false);
      setConfirmLogoutAllOpen(false);
      clearSession(true);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Sécurité du compte"
        description="Modifiez votre mot de passe et gérez vos sessions actives."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            Changer mon mot de passe
          </CardTitle>
          <CardDescription>
            Par sécurité, toutes vos sessions actives seront fermées après la modification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="danger" title="Modification refusée">
                {serverError}
              </Alert>
            )}

            <FormField
              id="currentPassword"
              label="Mot de passe actuel"
              required
              error={errors.currentPassword?.message}
            >
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                hasError={Boolean(errors.currentPassword)}
                {...register('currentPassword')}
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

            <Button type="submit" isLoading={isSubmitting}>
              Mettre à jour le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions actives</CardTitle>
          <CardDescription>
            Déconnectez cet appareil ou révoquez l&apos;ensemble de vos jetons de session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleLogoutCurrent}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter de cet appareil
          </Button>
          <Button variant="destructive" onClick={() => setConfirmLogoutAllOpen(true)}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Déconnecter tous mes appareils
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmLogoutAllOpen}
        onOpenChange={setConfirmLogoutAllOpen}
        title="Déconnecter tous les appareils ?"
        description="Toutes vos sessions actives sur l'ensemble de vos navigateurs et appareils seront immédiatement révoquées."
        confirmLabel="Tout déconnecter"
        variant="destructive"
        isLoading={isLoggingOutAll}
        onConfirm={handleLogoutAll}
      />
    </div>
  );
}
