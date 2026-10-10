import React, { useState } from 'react';
import { 
  getDirectPhotoUrl, 
  getDevoteeInitials, 
  getDevoteeColorStyle 
} from '../../utils/avatarUtils';

interface DevoteeAvatarProps {
  photoUrl?: string;
  name?: string;
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[9px]', ring: 'ring-1' },
  sm: { box: 'w-8 h-8', text: 'text-[11px]', ring: 'ring-1' },
  md: { box: 'w-10 h-10', text: 'text-xs', ring: 'ring-1.5' },
  lg: { box: 'w-12 h-12', text: 'text-sm', ring: 'ring-2' },
  xl: { box: 'w-16 h-16', text: 'text-base', ring: 'ring-2' },
  '2xl': { box: 'w-24 h-24', text: 'text-2xl', ring: 'ring-4' },
};

export const DevoteeAvatar: React.FC<DevoteeAvatarProps> = ({
  photoUrl,
  name = 'Devotee',
  id = '',
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const directUrl = getDirectPhotoUrl(photoUrl, name, id);
  const initials = getDevoteeInitials(name);
  const colorStyle = getDevoteeColorStyle(id || name);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const shouldRenderImage = Boolean(directUrl) && !hasError;

  return (
    <div
      className={`relative rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold select-none ${
        sizeConfig.box
      } ${
        showBorder ? `${sizeConfig.ring} ring-slate-200/90 shadow-2xs` : ''
      } ${className}`}
      title={name}
    >
      {shouldRenderImage ? (
        <>
          {/* Skeleton / Initial placeholder while image loads */}
          {!isLoaded && (
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${colorStyle.gradient} text-white flex items-center justify-center ${sizeConfig.text}`}
            >
              <span>{initials}</span>
            </div>
          )}

          <img
            src={directUrl}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        /* Fallback Gorgeous Vaishnava Gradient Avatar */
        <div
          className={`w-full h-full bg-gradient-to-tr ${colorStyle.gradient} text-white flex items-center justify-center shadow-inner ${sizeConfig.text}`}
        >
          <span>{initials}</span>
        </div>
      )}
    </div>
  );
};
