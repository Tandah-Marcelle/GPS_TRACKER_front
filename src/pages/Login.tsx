import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { notifications } from '@mantine/notifications';
import {
  AuthShell,
  BottomGradient,
  BrandHeader,
  FieldError,
  LabelInputContainer,
  TestAccountsPanel,
} from '@/components/auth/AuthShell';

export default function Login() {
  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.identifier.trim().length < 3) errs.identifier = 'Enter your username or email';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const res = await login(form.identifier, form.password);
      setEmail(res.email);
      setOtp('');
      setDevOtp(res.devOtp ?? null);
      setStep('otp');
      notifications.show({
        title: 'OTP sent',
        message: res.devOtp
          ? `Code emailed to ${res.email} (dev code shown below)`
          : `A 6-digit code was sent to ${res.email}`,
        color: 'teal',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const message = Array.isArray(msg) ? msg.join(', ') : msg || 'Invalid credentials';
      notifications.show({ title: 'Login failed', message, color: 'red' });
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      notifications.show({ title: 'Error', message: 'The OTP must be 6 digits', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      await verifyLoginOtp(email, otp);
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      notifications.show({ title: 'Welcome', message: 'Logged in successfully', color: 'teal' });
      navigate(user?.role === 'TECHNICIAN' ? '/my-interventions' : '/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const message = Array.isArray(msg) ? msg.join(', ') : msg || 'Invalid OTP';
      notifications.show({ title: 'Verification failed', message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <BrandHeader title="Camtrack" subtitle="GPS tracker stock & installation management" />

          <Card className="border-border/80 bg-card/90 shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                {step === 'credentials' ? 'Sign in' : 'Verify your identity'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {step === 'credentials'
                  ? 'Enter your credentials, then we email you a one-time code.'
                  : `We sent a 6-digit code to ${email}`}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {step === 'credentials' ? (
                <form onSubmit={handleCredentials} className="space-y-4">
                  <LabelInputContainer>
                    <Label htmlFor="identifier" className="text-foreground/90">
                      Username or email
                    </Label>
                    <Input
                      id="identifier"
                      placeholder="manager or you@example.com"
                      autoComplete="username"
                      value={form.identifier}
                      onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    />
                    <FieldError>{errors.identifier}</FieldError>
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="password" className="text-foreground/90">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <FieldError>{errors.password}</FieldError>
                  </LabelInputContainer>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="group/btn relative h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? 'Sending code…' : 'Continue →'}
                    <BottomGradient />
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    No account yet?{' '}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                      Create one
                    </Link>
                  </p>

                  <TestAccountsPanel />
                </form>
              ) : (
                <form onSubmit={handleOtp} className="space-y-5">
                  {devOtp && (
                    <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        Dev mode — code returned by the API
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <code className="font-mono text-2xl tracking-[0.3em] text-foreground">{devOtp}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setOtp(devOtp)}
                        >
                          Use this code
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Only shown because the backend runs outside production. Accounts with a{' '}
                        <code className="font-mono">.local</code> address cannot receive real mail.
                      </p>
                    </div>
                  )}

                  <LabelInputContainer>
                    <Label htmlFor="otp" className="text-foreground/90">
                      One-time code
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-14 text-center font-mono text-2xl tracking-[0.45em]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Codes expire after 10 minutes. Check the spam folder if it does not arrive.
                    </p>
                  </LabelInputContainer>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="group/btn relative h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? 'Verifying…' : 'Verify & sign in →'}
                    <BottomGradient />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStep('credentials');
                      setDevOtp(null);
                      setOtp('');
                    }}
                  >
                    ← Use different credentials
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
    </AuthShell>
  );
}
