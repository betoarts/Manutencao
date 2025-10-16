import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';

interface OpenRequestsNotificationProps {
  count: number;
}

const OpenRequestsNotification: React.FC<OpenRequestsNotificationProps> = ({ count }) => {
  if (count === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
      <BellRing className="h-4 w-4" />
      <AlertTitle>Atenção!</AlertTitle>
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span>Você tem <strong className="font-bold">{count} chamado(s)</strong> de manutenção em andamento.</span>
        <Button asChild variant="outline" className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-700 border-yellow-300 dark:border-yellow-600">
          <Link to="/requests">Ver Chamados</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default OpenRequestsNotification;