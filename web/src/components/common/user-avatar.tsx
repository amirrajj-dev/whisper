'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOnline?: boolean;
  showIndicator?: boolean;
}

const sizeMap = {
  sm: { avatar: 28, indicator: 2.5 },
  md: { avatar: 36, indicator: 3 },
  lg: { avatar: 44, indicator: 3.5 },
  xl: { avatar: 64, indicator: 4 },
};

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
  xl: 'w-16 h-16',
};

export function UserAvatar({
  src,
  alt,
  size = 'md',
  className = '',
  isOnline,
  showIndicator = false,
}: UserAvatarProps) {
  const dimensions = sizeMap[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-base-300`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={dimensions.avatar}
            height={dimensions.avatar}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/40">
            <User className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'}`} />
          </div>
        )}
      </div>
      {showIndicator && isOnline !== undefined && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-base-100 ${
            isOnline ? 'bg-success' : 'bg-base-content/30'
          }`}
          style={{
            width: dimensions.indicator * 2.5,
            height: dimensions.indicator * 2.5,
          }}
        />
      )}
    </div>
  );
}
