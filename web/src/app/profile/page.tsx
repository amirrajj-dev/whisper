'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { useAuthStore } from '@/src/stores/auth.store';
import { userApi } from '@/src/services/user.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { Camera, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  bio: z.string().max(70).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isAuthLoading, router]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      userApi.updateMe(
        { username: data.username, email: data.email, bio: data.bio || undefined },
        avatarFile || undefined,
      ),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      useAuthStore.getState().setUser(updatedUser);
      toast.success('Profile updated');
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/app" className="btn btn-ghost btn-sm gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to chats
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <UserAvatar
                src={avatarPreview || user?.avatarUrl}
                alt={user?.username || ''}
                size="xl"
                className="ring-4 ring-base-200"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 btn btn-primary btn-circle btn-sm"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <h1 className="text-2xl font-bold mt-4">{user?.username}</h1>
            <p className="text-sm text-base-content/40">{user?.email}</p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6">
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Username</span>
                </label>
                <input
                  type="text"
                  {...register('username')}
                  className={`input outline-none w-full ${errors.username ? 'input-error' : ''}`}
                />
                {errors.username && (
                  <p className="text-error text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`input outline-none w-full ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Bio</span>
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className={`textarea outline-none w-full resize-none ${errors.bio ? 'textarea-error' : ''}`}
                  placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                  <p className="text-error text-xs mt-1">{errors.bio.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending || (!isDirty && !avatarFile)}
                className="btn btn-primary w-full gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
