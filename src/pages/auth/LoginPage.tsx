import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/authSelectors';
import { DEMO_ACCOUNTS } from '@/utils/constants';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await dispatch(
        loginUser({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        })
      ).unwrap();

      // Check if user came from a guarded page
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const targetRoute = from || getRoleHomeRoute(result.user.role);
      navigate(targetRoute, { replace: true });
    } catch {
      // Error handled by Redux state
    }
  };

  const handleDemoSelect = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
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
                Mock Mode Active
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

          <CardContent>
            {authError && (
              <div className="mb-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {authError}
              </div>
            )}

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
    </div>
  );
};

export default LoginPage;
