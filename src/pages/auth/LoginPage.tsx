import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, loginWithGoogle } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/authSelectors';
import { DEMO_ACCOUNTS } from '@/utils/constants';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Key } from 'lucide-react';
import { getRoleHomeRoute } from '@/routes/roleRoutes';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid academic email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const authError = useAppSelector(selectAuthError);
  const authStatus = useAppSelector(selectAuthStatus);
  const isLoading = authStatus === 'loading';

  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleCustomToken, setGoogleCustomToken] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const redirectAfterLogin = (role: string) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    const targetRoute = from || getRoleHomeRoute(role as any);
    navigate(targetRoute, { replace: true });
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await dispatch(
        loginUser({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        })
      ).unwrap();

      redirectAfterLogin(result.user.role);
    } catch {
      // Error handled by Redux state
    }
  };

  const handleDemoSelect = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const handleGoogleSignInClick = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Check if Google GIS client is loaded in window
    const win = window as any;
    if (clientId && win.google?.accounts?.id) {
      setIsGoogleLoading(true);
      try {
        win.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              const res = await dispatch(loginWithGoogle(response.credential)).unwrap();
              redirectAfterLogin(res.user.role);
            }
          },
        });
        win.google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google One Tap prompt error:', e);
        setIsGoogleModalOpen(true);
      } finally {
        setIsGoogleLoading(false);
      }
    } else {
      // Prompt modal for live token or instant mock verification
      setIsGoogleModalOpen(true);
    }
  };

  const handleGoogleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGoogleLoading(true);
    try {
      const token = googleCustomToken.trim() || 'demo-google-oauth-token';
      const res = await dispatch(loginWithGoogle(token)).unwrap();
      setIsGoogleModalOpen(false);
      redirectAfterLogin(res.user.role);
    } catch {
      // Handled in Redux
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-background dark:via-background dark:to-muted/20">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand & Intro */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-600 dark:text-primary-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AY 2026-27 Engineering Portal</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/25">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                CampusConnect
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unified Campus Communication and Classroom Platform with integrated LMS, doubt-clearing
              VoIP calls, real-time messaging, and strict role-based access control.
            </p>
          </div>

          {/* Quick Demo Switcher Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>One-Click Demo Accounts</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Development Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoSelect(acc.email, acc.pass)}
                  className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted/80 hover:border-primary-500/50 transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between w-full">
                    <RoleBadge role={acc.role} />
                    <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary-600">
                      Auto-fill &rarr;
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-1.5 truncate">{acc.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <Card className="lg:col-span-6 shadow-xl border-border/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your institutional credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {authError}
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/70 text-foreground font-semibold text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Verifying with Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Or with institutional email
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Academic Email"
                type="email"
                placeholder="e.g. admin@campus.test or student1@campus.test"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-foreground text-muted-foreground focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    {...register('rememberMe')}
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full gap-2 mt-2">
                <span>Sign In to CampusConnect</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="border-t border-border/50 text-center justify-center text-xs text-muted-foreground pt-4">
            Need help accessing your account? Contact{' '}
            <span className="text-primary-600 ml-1 font-medium">support@campus.test</span>
          </CardFooter>
        </Card>
      </div>

      {/* Google Authentication Dialog */}
      <Dialog
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Google Authentication Gateway"
        description="Verify your Google Account with CampusConnect Spring Boot Backend"
      >
        <form onSubmit={handleGoogleSubmitToken} className="space-y-4">
          <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-foreground space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
              <Key className="w-3.5 h-3.5" />
              Backend OpenID Token Verification
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Google ID tokens are securely sent to <code className="text-primary-600 font-mono">POST /api/auth/google</code>,
              where signature, audience, and email verification claims are verified by Spring Security.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Google ID Token (Optional if using dev simulation):
            </label>
            <textarea
              rows={3}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Paste Google JWT id_token here, or leave empty to test default verified Google Student account..."
              value={googleCustomToken}
              onChange={(e) => setGoogleCustomToken(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGoogleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isGoogleLoading}>
              Authenticate with Google
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default LoginPage;
