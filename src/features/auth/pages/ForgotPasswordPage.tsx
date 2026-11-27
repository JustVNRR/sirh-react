import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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
} from '@/shared/ui';
import { authApi } from '../api/authApi';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/authSchemas';

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(values);
      setSubmittedEmail(values.email);
    } catch (error) {
      if (error instanceof ApiError && error.isRateLimited) {
        setServerError('Trop de demandes effectuées. Veuillez patienter avant de réessayer.');
      } else if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Recevez un code de vérification à 6 chiffres valable 15 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submittedEmail ? (
          <div className="space-y-4">
            <Alert variant="success" title="Demande enregistrée">
              Si un compte actif correspond à cette adresse, un code de réinitialisation à 6
              chiffres vient d&apos;être envoyé par email.
            </Alert>
            <Button asChild className="w-full">
              <Link to={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}>
                Saisir mon code de réinitialisation
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="danger" title="Erreur">
                {serverError}
              </Alert>
            )}

            <FormField
              id="email"
              label="Email professionnel"
              required
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@entreprise.fr"
                hasError={Boolean(errors.email)}
                {...register('email')}
              />
            </FormField>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Envoyer le code
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="text-xs font-medium text-[var(--primary)] hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
