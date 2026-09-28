import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { getRoleHomeRoute } from '@/routes/roleRoutes';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const homeRoute = getRoleHomeRoute(user?.role);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 rounded-3xl border border-border bg-card shadow-xl text-center space-y-5 animate-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase">
            Error 403 &bull; Access Denied
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">Restricted Access</h1>
          <p className="text-sm text-muted-foreground">
            You do not have the required role permissions to view this resource. Your current role is{' '}
            <span className="font-semibold text-foreground">{user?.role || 'Guest'}</span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Button onClick={() => navigate(homeRoute)} className="gap-2">
            <Home className="w-4 h-4" /> Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
