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
  FieldHint,
  LabelInputContainer,
} from '@/components/auth/AuthShell';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'TECHNICIAN' as 'TECHNICIAN' | 'STOCK_MANAGER',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (formData.username.trim().length < 3) e.username = 'At least 3 characters';
    if (!EMAIL_RE.test(formData.email.trim())) e.email = 'Enter a valid email address';
    if (formData.fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (formData.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register(formData);
      setEmail(res.email);
      setOtp('');
      setDevOtp(res.devOtp ?? null);
      setStep('otp');
      notifications.show({
        title: 'Verification code sent',
        message: res.devOtp
          ? `Code emailed to ${res.email} (dev code shown below)`
          : `Check ${res.email} for your 6-digit code`,
        color: 'teal',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const message = Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed';
      notifications.show({ title: 'Registration failed', message, color: 'red' });
      if (message.toLowerCase().includes('username')) setErrors({ username: message });
      else if (message.toLowerCase().includes('email')) setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      notifications.show({ title: 'Error', message: 'The OTP must be 6 digits', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      notifications.show({
        title: 'Email verified',
        message: 'Your account is ready — taking you to the dashboard',
        color: 'teal',
      });
      navigate('/dashboard', { replace: true });
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
        <BrandHeader title="Create your account" subtitle="Two-minute setup, verified by email" />

        <Card className="border-border/80 bg-card/90 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {step === 'form' ? 'Sign up' : 'Verify your email'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'form'
                ? 'We will email you a one-time code to activate your account.'
                : `Enter the 6-digit code sent to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'form' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <LabelInputContainer>
                  <Label htmlFor="username" className="text-foreground/90">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="marcelle"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                  <FieldError>{errors.username}</FieldError>
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="fullName" className="text-foreground/90">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Marcelle Tandah"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <FieldError>{errors.fullName}</FieldError>
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="email" className="text-foreground/90">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <FieldError>{errors.email}</FieldError>
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="password" className="text-foreground/90">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <FieldError>{errors.password}</FieldError>
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="role" className="text-foreground/90">
                    Role
                  </Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'TECHNICIAN' | 'STOCK_MANAGER' })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="STOCK_MANAGER">STOCK_MANAGER</option>
                  </select>
                  <FieldHint>
                    Technicians manage their own interventions. Stock managers also control inventory.
                  </FieldHint>
                </LabelInputContainer>

                <Button
                  type="submit"
                  disabled={loading}
                  className="group/btn relative h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Creating account…' : 'Create account →'}
                  <BottomGradient />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already registered?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-5">
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
                  <FieldHint>Codes expire after 10 minutes. Check your spam folder if needed.</FieldHint>
                </LabelInputContainer>

                <Button
                  type="submit"
                  disabled={loading}
                  className="group/btn relative h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Verifying…' : 'Verify & continue →'}
                  <BottomGradient />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStep('form');
                      setDevOtp(null);
                      setOtp('');
                    }}
                  >
                    ← Back to the form
                  </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AuthShell>
  );
}
