import { Calculator, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { env } from '@/shared/config/env';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@/shared/ui';

const URSSAF_SIMULATOR_URL = 'https://mon-entreprise.urssaf.fr/simulateurs/salaire-brut-net';

export function UrssafEstimatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outils & Services externes"
        description="Simulateur officiel de cotisations URSSAF et accès sécurisé au coffre-fort de bulletins de paie."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                Estimateur de cotisations URSSAF
              </CardTitle>
              <CardDescription>
                Simulateur Mon-Entreprise (brut / net / coût total employeur).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={URSSAF_SIMULATOR_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Ouvrir dans un onglet
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {env.urssafEnabled ? (
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                <iframe
                  src={URSSAF_SIMULATOR_URL}
                  title="Simulateur de cotisations URSSAF"
                  className="h-[620px] w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            ) : (
              <Alert variant="info" title="Simulateur intégré désactivé">
                L’intégration en iframe est désactivée par configuration
                (`VITE_URSSAF_ENABLED=false`). Utilisez le bouton « Ouvrir dans un onglet »
                ci-dessus pour accéder directement au simulateur officiel.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
              Fiches de paie (eDocPerso)
            </CardTitle>
            <CardDescription>
              Accédez à votre coffre-fort personnel externe pour consulter et télécharger vos
              bulletins de paie dématérialisés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={env.edocPersoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Accéder à eDocPerso
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
