'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  User,
  Check,
  X,
} from 'lucide-react';
import { useRegister, useCurrentUser } from '@/src/hooks/use-auth';
import { useRouter } from 'next/navigation';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain uppercase, lowercase, number, and special character',
      ),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'You must accept the terms' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const blobAnimation = (i: number) => ({
  scale: [1, 1.15, 1],
  rotate: [0, 180, 360],
  opacity: [0.12, 0.2, 0.12] as number[],
  transition: {
    duration: 10 + i * 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
}) satisfies import('framer-motion').TargetAndTransition;

const strengthConfig = [
  { label: 'Weak', color: 'bg-error', minScore: 0 },
  { label: 'Fair', color: 'bg-warning', minScore: 1 },
  { label: 'Good', color: 'bg-info', minScore: 2 },
  { label: 'Strong', color: 'bg-success', minScore: 3 },
];

function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[@$!%*?&]/.test(password)) s++;
    return s;
  }, [password]);

  const strength = strengthConfig.find((c) => c.minScore === score) || strengthConfig[score];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: i < score ? '25%' : '25%', opacity: i < score ? 1 : 0.2 }}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < score ? strength.color : 'bg-base-300'
            }`}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs text-base-content/60">
          Password strength:{' '}
          <span className={`font-medium ${
            score <= 1 ? 'text-error' : score === 2 ? 'text-warning' : 'text-success'
          }`}>
            {strength.label}
          </span>
        </p>
      )}
    </div>
  );
}

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
  <motion.li
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-center gap-2 text-xs ${met ? 'text-success' : 'text-base-content/40'}`}
  >
    {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {label}
  </motion.li>
);

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { acceptTerms: false as unknown as true },
  });

  const watchPassword = watch('password');

  const passwordReqs = useMemo(
    () => [
      { met: (watchPassword?.length ?? 0) >= 8, label: 'At least 8 characters' },
      { met: /[a-z]/.test(watchPassword || ''), label: 'One lowercase letter' },
      { met: /[A-Z]/.test(watchPassword || ''), label: 'One uppercase letter' },
      { met: /\d/.test(watchPassword || ''), label: 'One number' },
      { met: /[@$!%*?&]/.test(watchPassword || ''), label: 'One special character' },
    ],
    [watchPassword],
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/app');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = (data: RegisterForm) => {
    if (registerMutation.isPending) return;
    const { username, email, password } = data;
    registerMutation.mutate({ username, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-100 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={blobAnimation(0)}
          className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[128px]"
        />
        <motion.div
          animate={blobAnimation(1)}
          className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-secondary/15 blur-[128px]"
        />
        <motion.div
          animate={blobAnimation(2)}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[160px]"
        />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <Image
            src="/whisper-responsive/icons8-chat-64.svg"
            alt="Whisper"
            width={28}
            height={28}
          />
          <span className="font-bold text-sm">Whisper</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="bg-base-100/80 backdrop-blur-xl rounded-2xl border border-base-300/50 shadow-2xl p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Image
                src="/whisper-responsive/icons8-chat-64.svg"
                alt="Whisper"
                width={48}
                height={48}
                className="drop-shadow-lg"
              />
            </motion.div>
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-base-content/60 text-sm">
              Join the conversation
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="johndoe"
                  autoComplete="username"
                  {...register('username')}
                  className={`input input-bordered w-full pl-10 ${
                    errors.username ? 'input-error' : ''
                  }`}
                />
              </div>
              <AnimatePresence>
                {errors.username && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-error text-xs mt-1"
                  >
                    {errors.username.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className={`input input-bordered w-full pl-10 ${
                    errors.email ? 'input-error' : ''
                  }`}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-error text-xs mt-1"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`input input-bordered w-full pl-10 pr-10 ${
                    errors.password ? 'input-error' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={watchPassword || ''} />
              <ul className="mt-2 space-y-1">
                {passwordReqs.map((req, i) => (
                  <PasswordRequirement key={i} met={req.met} label={req.label} />
                ))}
              </ul>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-error text-xs mt-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`input input-bordered w-full pl-10 pr-10 ${
                    errors.confirmPassword ? 'input-error' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-error text-xs mt-1"
                  >
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="checkbox checkbox-primary checkbox-xs mt-0.5"
                />
                <span className="text-xs text-base-content/60">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              <AnimatePresence>
                {errors.acceptTerms && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-error text-xs mt-1"
                  >
                    {errors.acceptTerms.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={registerMutation.isPending || !isValid}
                className="btn btn-primary w-full gap-2"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-base-content/60">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Sign in
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base-100 to-transparent pointer-events-none" />
    </div>
  );
}
