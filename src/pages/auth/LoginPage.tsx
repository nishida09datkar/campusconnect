import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, loginWithGoogle, registerUser, logoutUser } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus, selectCurrentUser } from '@/features/auth/authSelectors';
import { DEMO_ACCOUNTS } from '@/utils/constants';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Key,
  UserPlus,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { getRoleHomeRoute } from '@/routes/roleRoutes';
import { Role } from '@/types';

// Login Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid academic email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration Validation Schema
const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid institutional email is required'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    confirmPassword: z.string().min(4, 'Please confirm your password'),
    role: z.enum(['STUDENT', 'FACULTY'] as const),
    departmentId: z.string().optional(),
    rollNo: z.string().optional(),
    year: z.number().optional(),
    division: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useAppSelector(selectCurrentUser);
  const authError = useAppSelector(selectAuthError);
  const authStatus = useAppSelector(selectAuthStatus);
  const isLoading = authStatus === 'loading';

  // Toggle between Sign In and Register Mode
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleCustomToken, setGoogleCustomToken] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Register form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    watch: watchSignup,
    formState: { errors: signupErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      departmentId: 'dept-ce',
      rollNo: '',
      year: 3,
      division: 'A',
    },
  });

  const selectedRole = watchSignup('role');

  const redirectAfterLogin = (role: string) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    const targetRoute = from || getRoleHomeRoute(role as any);
    navigate(targetRoute, { replace: true });
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
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

  const onSignupSubmit = async (data: RegisterFormValues) => {
    try {
      const result = await dispatch(
        registerUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role as Role,
          departmentId: data.departmentId || 'dept-ce',
          rollNo: data.role === 'STUDENT' ? data.rollNo : undefined,
          year: data.role === 'STUDENT' ? data.year : undefined,
          division: data.role === 'STUDENT' ? data.division : undefined,
        })
      ).unwrap();

      redirectAfterLogin(result.user.role);
    } catch {
      // Error handled by Redux state
    }
  };

  const handleDemoSelect = (email: string, pass: string) => {
    setIsRegisterMode(false);
    setLoginValue('email', email, { shouldValidate: true });
    setLoginValue('password', pass, { shouldValidate: true });
  };

  const handleGoogleSignInClick = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
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
      setIsGoogleModalOpen(true);
    }
  };

  const handleGoogleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGoogleLoading(true);
    try {
      const token = googleCustomToken.trim() || 'demo-google-oauth-token';
      const result = await dispatch(loginWithGoogle(token)).unwrap();
      setIsGoogleModalOpen(false);
      redirectAfterLogin(result.user.role);
    } catch {
      // Error handled by Redux
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background/80 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Active Session Notification Banner */}
      {currentUser && (
        <div className="w-full max-w-5xl mb-6 p-4 rounded-2xl bg-card border border-primary/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Currently active session</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{currentUser.name}</span>
                <RoleBadge role={currentUser.role} />
                <span className="text-xs text-muted-foreground">({currentUser.email})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => redirectAfterLogin(currentUser.role)}
              className="flex-1 sm:flex-initial gap-1.5"
            >
              <span>Go to {currentUser.role} Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dispatch(logoutUser())}
              className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand & Features */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>CampusConnect Unified LMS</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              Institutional Learning &{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Collaboration Platform
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto lg:mx-0">
              Role-based academic management with real-time video lectures, interactive coursework, and MySQL persistence.
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

        {/* Right Column: Authentication Card (Sign In / Register) */}
        <Card className="lg:col-span-6 shadow-xl border-border/80">
          {/* Top Switcher Tabs */}
          <div className="p-3 border-b border-border/60 bg-muted/30 flex rounded-t-xl gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                !isRegisterMode
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                isRegisterMode
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Account</span>
            </button>
          </div>

          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {isRegisterMode ? 'Register New Academic Account' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription>
              {isRegisterMode
                ? 'Create a new institutional profile saved directly to the MySQL database'
                : 'Enter your institutional email & password to access your dashboard'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {authError}
              </div>
            )}

            {!isRegisterMode ? (
              /* ================= SIGN IN FORM ================= */
              <>
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

                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                  <Input
                    label="Academic Email"
                    type="email"
                    placeholder="e.g. user@campus.test or admin@campus.test"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={loginErrors.email?.message}
                    {...registerLogin('email')}
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
                    error={loginErrors.password?.message}
                    {...registerLogin('password')}
                  />

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        {...registerLogin('rememberMe')}
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
              </>
            ) : (
              /* ================= REGISTRATION FORM ================= */
              <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-3.5">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Aryan Sharma"
                  error={signupErrors.name?.message}
                  {...registerSignup('name')}
                />

                <Input
                  label="Institutional Email *"
                  type="email"
                  placeholder="e.g. student.aryan@campus.test"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={signupErrors.email?.message}
                  {...registerSignup('email')}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground/80">Role *</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      {...registerSignup('role')}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground/80">Department</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      {...registerSignup('departmentId')}
                    >
                      <option value="dept-ce">Computer Engineering</option>
                      <option value="dept-it">Information Technology</option>
                      <option value="dept-entc">Electronics & Telecom</option>
                    </select>
                  </div>
                </div>

                {selectedRole === 'STUDENT' && (
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border">
                    <Input
                      label="Roll No"
                      placeholder="e.g. CE310"
                      error={signupErrors.rollNo?.message}
                      {...registerSignup('rollNo')}
                    />
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-foreground/80">Year</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        {...registerSignup('year', { valueAsNumber: true })}
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-foreground/80">Division</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        {...registerSignup('division')}
                      >
                        <option value="A">Div A</option>
                        <option value="B">Div B</option>
                        <option value="C">Div C</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Password *"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 4 characters"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:text-foreground text-muted-foreground focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={signupErrors.password?.message}
                    {...registerSignup('password')}
                  />

                  <Input
                    label="Confirm Password *"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1 hover:text-foreground text-muted-foreground focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={signupErrors.confirmPassword?.message}
                    {...registerSignup('confirmPassword')}
                  />
                </div>

                <Button type="submit" isLoading={isLoading} className="w-full gap-2 mt-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Access Portal</span>
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/50 text-center justify-center text-xs text-muted-foreground pt-4">
            {!isRegisterMode ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1"
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1"
                >
                  Sign in to your account
                </button>
              </span>
            )}
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
